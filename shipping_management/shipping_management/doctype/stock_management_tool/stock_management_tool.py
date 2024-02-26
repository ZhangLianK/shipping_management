# Copyright (c) 2024, Alvin and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.model.mapper import get_mapped_doc
from frappe.utils import cint, cstr, flt, nowdate
from erpnext.setup.doctype.item_group.item_group import get_item_group_defaults
from erpnext.stock.doctype.item.item import get_item_defaults
from frappe.contacts.doctype.address.address import get_company_address
from frappe.model.utils import get_fetch_values
from frappe import _, msgprint
from erpnext.stock.utils import get_stock_balance
import math
import base64
from PIL import Image
from io import BytesIO
import os
import random
import string
from tencent_integration.tencent_integration.doctype.tencent_sms_log.tencent_sms_log import create_sms_log
import json


class StockManagementTool(Document):
	pass


@frappe.whitelist()
def get_scale_childs(ship_plan=None, type=None, transporter=None, purchase_order=None, sales_order=None, sales_invoice=None,export=None):
	# Initialize the filters dictionary with a condition that's always true
	filters = {
					'status': ['not in', ["6 已完成", "9 已取消"]],
					'type': ['in', ['IN', 'OUT', 'DIRC']],
				}
	
	if ship_plan is not None and not ship_plan == '':
		filters['ship_plan'] = ship_plan

	if sales_order is not None and not sales_order == '':
		filters['sales_order'] = sales_order

	if type is not None and not type == '':
		filters['type'] = type

	# Fetch all scale item docs according to ship_plan and any other provided filters
	scale_items = frappe.get_all('Scale Item', 
								 filters=filters, 
								 fields=['name', 'vehicle', 'type', 
										 'target_weight', 'status','load_net_weight','offload_net_weight','delivery_note', 'purchase_receipt',
										 'sales_invoice', 'sales_order', 'purchase_order','pot','bill_type'])

	# Return the scale_items as a list of dictionarie
	return scale_items


def set_missing_values(source, target):
	target.run_method("set_missing_values")
	target.run_method("calculate_taxes_and_totals")

@frappe.whitelist()
def make_purchase_receipt(source_name, target_doc=None):
    
	source_doc = frappe.get_doc("Scale Item", source_name)	
	if source_doc.type == 'IN' and not source_doc.pot:
		frappe.throw('无【罐（库位）】信息')
	
	if source_doc.purchase_receipt:
		frappe.throw('该物流单已经创建了采购收货单！')
  
	def update_parent(obj, target,source_parent):
		print(target)
		target.scale_item = source_doc.name
		target.set_warehouse = source_doc.pot

	def update_item(obj, target, source_parent):
		target.warehouse = source_doc.pot
		if	source_doc.type == 'IN':
			target.qty = flt(source_doc.offload_net_weight)
			target.stock_qty = flt(source_doc.offload_net_weight) * flt(obj.conversion_factor)
			if source_doc.price_ls:
				target.rate = flt(source_doc.price_ls)
				target.amount = flt(source_doc.offload_net_weight)  * target.rate
				target.base_amount = (flt(source_doc.offload_net_weight) * target.rate * flt(source_parent.conversion_rate))
			else:
				target.amount = flt(source_doc.offload_net_weight)  * flt(obj.rate)
				target.base_amount = (
				flt(source_doc.offload_net_weight) * flt(obj.rate) * flt(source_parent.conversion_rate)
		)
		if	source_doc.type == 'DIRC':
			target.qty = flt(source_doc.load_net_weight)
			target.stock_qty = flt(source_doc.load_net_weight) * flt(obj.conversion_factor)
			target.amount = flt(source_doc.load_net_weight)  * flt(obj.rate)
			target.base_amount = (
			flt(source_doc.load_net_weight) * flt(obj.rate) * flt(source_parent.conversion_rate)
		)

	source_doc = frappe.get_doc("Scale Item", source_name)
	source = source_doc.purchase_order
	doc = get_mapped_doc(
		"Purchase Order",
		source,
		{
			"Purchase Order": {
				"doctype": "Purchase Receipt",
				"field_map": {"supplier_warehouse": "supplier_warehouse"},
				"validation": {
					"docstatus": ["=", 1],
				},
				"postprocess": update_parent,
			},
			"Purchase Order Item": {
				"doctype": "Purchase Receipt Item",
				"field_map": {
					"name": "purchase_order_item",
					"parent": "purchase_order",
					"bom": "bom",
					"material_request": "material_request",
					"material_request_item": "material_request_item",
				},
				"postprocess": update_item,
				"condition": lambda doc: abs(doc.received_qty) < abs(doc.qty)
				and doc.delivered_by_supplier != 1,
			},
			"Purchase Taxes and Charges": {"doctype": "Purchase Taxes and Charges", "add_if_empty": True},
		},
		target_doc,
		set_missing_values,
	)

	doc.set_onload("ignore_price_list", True)

	doc.save()
	doc.submit()
	return {'status': 'success', 'doc_name': doc.name}



@frappe.whitelist()
def make_delivery_note(source_name, target_doc=None, skip_item_mapping=False):
	from erpnext.stock.doctype.packed_item.packed_item import make_packing_list
	source_doc = frappe.get_doc("Scale Item", source_name)
	if source_doc.type == 'OUT' and not source_doc.pot:
		frappe.throw('无【罐（库位）】信息')
  
	if source_doc.delivery_note:
		frappe.throw('该物流单已经创建了出库单！')
	
	if source_doc.type == 'DIRC' and not source_doc.purchase_receipt:
		frappe.throw('外卖物流单必须先创建采购收货单！')
	source = source_doc.sales_order
	if source_doc.sales_invoice:
		source_si = source_doc.sales_invoice
		source_si_doc = frappe.get_doc("Sales Invoice", source_si)
	else :
		source_si = None
		source_si_doc = None

	def set_missing_values(source, target):
		target.run_method("set_missing_values")
		target.run_method("set_po_nos")
		target.run_method("calculate_taxes_and_totals")

		if source.company_address:
			target.update({"company_address": source.company_address})
		else:
			# set company address
			target.update(get_company_address(target.company))

		if target.company_address:
			target.update(get_fetch_values("Delivery Note", "company_address", target.company_address))

		make_packing_list(target)

	def update_item(source, target, source_parent):
		target.base_amount = (flt(source.qty) - flt(source.delivered_qty)) * flt(source.base_rate)
		target.amount = (flt(source.qty) - flt(source.delivered_qty)) * flt(source.rate)
		target.qty = flt(source.qty) - flt(source.delivered_qty)

		target.warehouse = source_doc.pot
		if	source_doc.bill_type == 'ZT':
			target.qty = flt(source_doc.load_net_weight)
			target.amount = flt(source_doc.offload_net_weight)  * flt(source.rate)
			target.base_amount = (flt(source_doc.load_net_weight) * flt(source.rate))
			if source_si:
				target.against_sales_invoice = source_si
				target.si_detail = source_si_doc.items[0].name
		if	source_doc.bill_type == 'SD':
			target.qty = flt(source_doc.offload_net_weight)
			target.amount = flt(source_doc.offload_net_weight)  * flt(source.rate)
			target.base_amount = (flt(source_doc.offload_net_weight) * flt(source.rate))
			if source_si:
				target.against_sales_invoice = source_si
				target.si_detail = source_si_doc.items[0].name

		item = get_item_defaults(target.item_code, source_parent.company)
		item_group = get_item_group_defaults(target.item_code, source_parent.company)

		if item:
			target.cost_center = (
				frappe.db.get_value("Project", source_parent.project, "cost_center")
				or item.get("buying_cost_center")
				or item_group.get("buying_cost_center")
			)

	def	update_parent(source, target, source_parent):
		target.scale_item = source_doc.name
		target.set_warehouse = source_doc.pot

	mapper = {
		"Sales Order": {"doctype": "Delivery Note", 
						"validation": {"docstatus": ["=", 1]},
						"postprocess": update_parent},
		"Sales Taxes and Charges": {"doctype": "Sales Taxes and Charges", "add_if_empty": True},
		"Sales Team": {"doctype": "Sales Team", "add_if_empty": True},
	}

	if not skip_item_mapping:

		def condition(doc):
			# make_mapped_doc sets js `args` into `frappe.flags.args`
			if frappe.flags.args and frappe.flags.args.delivery_dates:
				if cstr(doc.delivery_date) not in frappe.flags.args.delivery_dates:
					return False
			return abs(doc.delivered_qty) < abs(doc.qty) and doc.delivered_by_supplier != 1

		mapper["Sales Order Item"] = {
			"doctype": "Delivery Note Item",
			"field_map": {
				"rate": "rate",
				"name": "so_detail",
				"parent": "against_sales_order",
			},
			"postprocess": update_item,
			"condition": condition,
		}

	target_doc = get_mapped_doc("Sales Order", source, mapper, target_doc, set_missing_values)

	target_doc.set_onload("ignore_price_list", True)

	target_doc.save()
	target_doc.submit()
	return {'status': 'success', 'doc_name': target_doc.name}