# Copyright (c) 2023, Alvin and contributors
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


class ScaleItem(Document):
	def get_verification_code(self):
		driver_phone_number = frappe.get_value("Driver", self.driver, "cell_number")
		if driver_phone_number:
			if not self.verification_code:
				#generate verification code with number of 6 digits
				self.verification_code = ''.join(random.choices(string.digits, k=6))
				self.save(ignore_permissions=True)
			#generate a json list with the driver number
			driver_phone_number_list = json.dumps([driver_phone_number])
			variable_list = json.dumps([self.verification_code])
			#send sms to driver
			create_sms_log(self.company, "ship_verification_code", driver_phone_number_list, variable_list)
			print('send sms')

	def send_notification_sms(self):
		driver_phone_number = self.cell_number
		if driver_phone_number:
			if not self.verification_code:
				#generate verification code with number of 6 digits
				self.verification_code = ''.join(random.choices(string.digits, k=6))
				self.save(ignore_permissions=True)
			#generate a json list with the driver number
			driver_phone_number_list = json.dumps([driver_phone_number])
			variable_list = json.dumps([self.verification_code,self.name])
			#send sms to driver
			create_sms_log(self.company, "ship_order_notification", driver_phone_number_list, variable_list)
			print('send sms')
   
   
	def check_credit_limit(self):
		from erpnext.selling.doctype.customer.customer import check_credit_limit

		sales_order_doc = frappe.get_doc('Sales Order', self.sales_order,ignore_permissions=True)
		total_qty_vehicle = self.target_weight + sales_order_doc.qty_vehicle

		extra_amount = 0
		validate_against_credit_limit = False
		bypass_credit_limit_check_at_sales_order = cint(
			frappe.db.get_value(
				"Customer Credit Limit",
				filters={"parent": sales_order_doc.customer, "parenttype": "Customer", "company": sales_order_doc.company},
				fieldname="bypass_credit_limit_check",
			)
		)

		if bypass_credit_limit_check_at_sales_order:

			validate_against_credit_limit = True
			extra_amount = total_qty_vehicle / sales_order_doc.total_qty * sales_order_doc.grand_total

		if validate_against_credit_limit:
			check_credit_limit(
				sales_order_doc.customer, sales_order_doc.company, bypass_credit_limit_check_at_sales_order, extra_amount
			)

	def calculate_weight(self):
		if (not self.load_net_weight) and self.load_blank_weight and self.load_gross_weight:
			self.load_net_weight = self.load_gross_weight - self.load_blank_weight
		if (not self.offload_net_weight) and self.offload_blank_weight and self.offload_gross_weight:
			self.offload_net_weight = self.offload_gross_weight - self.offload_blank_weight

	def check_weight(self):
		if self.status == "3 已装货" and (self.load_gross_weight and self.load_blank_weight):
			if not math.isclose(flt(self.load_net_weight), flt(self.load_gross_weight) - flt(self.load_blank_weight)):
				frappe.throw("装货净重不等于毛重减空重，请检查磅单信息")
		if self.status == "5 已卸货" and (self.offload_gross_weight and self.offload_blank_weight):
			if not math.isclose(flt(self.offload_net_weight) , flt(self.offload_gross_weight) - flt(self.offload_blank_weight)):
				frappe.throw("卸货净重不等于毛重减空重，请检查磅单信息")

	def change_status(self):
		print("change status")
		if self.status == '0 新配' and self.pot:
			self.status = '1 已配罐'

		#if self.status[0] < '2'[0]:
		if self.offload_net_weight and self.status[0] < '5':
			self.status = "5 已卸货"
		elif self.offload_gross_weight and self.status[0] < '4':
			self.status = "4 正在卸货"
		elif self.offload_blank_weight and self.status[0] < '5':
			self.status = "5 已卸货"
		elif self.load_net_weight and self.status[0] < '3':
			self.status = "3 已装货"
		elif self.load_blank_weight and self.status[0] < '2':
			self.status = "2 正在装货"
		elif self.load_gross_weight and self.status[0] < '3':
			self.status = "3 已装货"
		else:
			self.status = self.status
	
	def validate_qty_in(self):
		purchase_order = self.purchase_order
		# Get the related Purchase Invoice Items
		purchase_invoice_items = frappe.get_all("Purchase Invoice Item", filters={'purchase_order': purchase_order}, fields=['parent'])
	
		# Prepare list of Purchase Invoices for query
		purchase_invoices = [item.parent for item in purchase_invoice_items]
		related_docs = purchase_invoices + [purchase_order]
	
		# Query Payment Entry References
		payment_entry_refs = frappe.get_all("Payment Entry Reference", filters={'reference_name': ['in', related_docs]}, fields=['allocated_amount'])
	
		# Calculate total allocated amount
		total_allocated_amount = sum([ref.allocated_amount for ref in payment_entry_refs])
	
		# Get the first item rate from Purchase Order
		purchase_order_doc = frappe.get_doc("Purchase Order", purchase_order,ignore_permissions=True)
		first_item_rate = purchase_order_doc.items[0].rate if purchase_order_doc.items else 0
	
		# Calculate the quantity that can be purchased with the total allocated amount
		qty = total_allocated_amount / first_item_rate if first_item_rate else 0
	
		total_qty_vehicle = self.target_weight + purchase_order_doc.qty_vehicle
	
		if total_qty_vehicle  > qty:
		
			frappe.throw(f"采购订单的总配车吨数:{total_qty_vehicle}超过已付款总量: {qty}")  

	def validate_qty_out(self):
		#pass
		#sales_invoice = frappe.get_doc('Sales Invoice', self.sales_invoice)
		#get all scale items doc related to this sales invoice except status is cancel
		#and then sum all target_weight
		#scale_items = frappe.get_all("Scale Item", filters={'sales_invoice': self.sales_invoice, 'status': ['!=', '6 已取消']}, fields=['target_weight'])	
		#total_qty = sum([scale_item.target_weight for scale_item in scale_items]) + self.target_weight
	
		#if sales_invoice.items[0].qty  < total_qty:
		#	frappe.throw(f"总配车吨数超过销售费用清单 {self.sales_invoice} 的总量")
		self.check_credit_limit()

	def validate_load(self):
	#	vehicle_doc = frappe.get_doc('Vehicle',self.vehicle)
	#	if self.target_weight > vehicle_doc.load_capacity:
	#		frappe.throw(_(f"目标运输量超过核定载重量，请再次检查【目标运输量】"), frappe.CannotEditDocumentError)
	#	if not self.target_weight:
	#		frappe.throw(_(f"【计划运量】不能为0"))
		pass


	def validate_pot(self):
		
		# if the pot and item both exist, then check else skip
		if not self.pot or not self.item:
			return
		item_code = self.item  # Replace with your actual item code
		warehouse = self.pot  # Assuming the warehouse name is in a field named 'warehouse'


		#set filters for get_all
		filters = {
			"item_code": item_code,
			"warehouse": warehouse,
			"company": self.company,
			"priority": 1,
			"disable": 0,
		}

		capacity_data = frappe.db.get_all(
		"Putaway Rule",
		fields=["item_code", "warehouse", "stock_capacity", "company"],
		filters=filters,
		)

		if not capacity_data:
			frappe.throw(f"没有找到对应的库位容量数据，请检查【罐】信息是否正确, 或者【入库规则->容量】中没有对应的数据")
		else:
			stock_capacity = capacity_data[0].stock_capacity

		balance_qty = get_stock_balance(item_code, warehouse, nowdate()) or 0

	
		if warehouse:
		
			query = """
				SELECT name, target_weight
				FROM `tabScale Item`
				WHERE CAST(LEFT(status, 1) AS UNSIGNED) <= 5
				and pot = %s
				AND status != '9 已取消' AND purchase_receipt is null
			"""
			documents = frappe.db.sql(query, (self.pot,), as_dict=True)
			total_target_qty = sum([doc.target_weight for doc in documents])
	
			#if not self.is_new():
			#	ori_doc=  self.get_doc_before_save()
			#	ori_target_weight = ori_doc.target_weight
			#	if (balance_qty + total_target_qty - ori_target_weight + self.target_weight) > stock_capacity:
			#		plan_qty = total_target_qty - ori_target_weight + self.target_weight
			#		frappe.throw(f'总入罐数量已经超过罐体容量： {stock_capacity},  当前库存： {balance_qty},  计划入库量： {plan_qty}' )
			#else:
			if (balance_qty + total_target_qty + self.target_weight) > stock_capacity:
				plan_qty = total_target_qty + self.target_weight
				frappe.throw(f'总入罐数量已经超过罐体容量： {stock_capacity},  当前库存： {balance_qty},  相关物流单计划入库总量： {plan_qty}' )

	def validate_status(self):
		print("validate status")
		if not self.is_new():
			ori_doc=  self.get_doc_before_save()
			if (ori_doc.status[0] > self.status[0]):
				frappe.throw(_(f"无法从状态 '{ori_doc.status}' 修改为 '{self.status}' ！"), frappe.ValidationError)

	def update_order_scale_weight(self):
		old_doc = self.get_doc_before_save()
		old_target_weight = old_doc.target_weight

		if self.purchase_order:
			purchase_order = frappe.get_doc("Purchase Order", self.purchase_order,ignore_permissions=True)
			purchase_order.qty_vehicle  = purchase_order.qty_vehicle + self.target_weight - old_target_weight
			purchase_order.save(ignore_permissions=True)

		if self.sales_order:
			sales_order = frappe.get_doc("Sales Order", self.sales_order, ignore_permissions=True)
			sales_order.qty_vehicle  = sales_order.qty_vehicle + self.target_weight - old_target_weight
			sales_order.save(ignore_permissions=True)

		if self.sales_invoice:
			sales_invoice = frappe.get_doc("Sales Invoice", self.sales_invoice,ignore_permissions=True)
			sales_invoice.qty_vehicle  = sales_invoice.qty_vehicle + self.target_weight - old_target_weight
			sales_invoice.save(ignore_permissions=True)
		
		if self.ship_plan:
			ship_plan = frappe.get_doc("Ship Plan", self.ship_plan,ignore_permissions=True)
			ship_plan.assigned_qty = ship_plan.assigned_qty + self.target_weight - old_target_weight
			ship_plan.save(ignore_permissions=True)
   
	def before_save(self):
		if self.market_segment == '粮食':
			if self.type == 'IN' and self.offload_net_weight and self.price_ls and not self.amount_ls:
				self.amount_ls = self.offload_net_weight * self.price_ls
			if self.type == 'OUT' and self.load_net_weight and self.price_ls and not self.amount_ls:
				self.amount_ls = self.load_net_weight * self.price_ls
		#get supplier from vehicle master
		#if not self.transporter:
		#	vehicle_doc = frappe.get_doc('Vehicle',self.vehicle)
		#	if vehicle_doc:
		#		self.transporter = vehicle_doc.transporter
		#采购收货处理逻辑开始purchase receipt process logic start
		self.change_status()
		if self.type == 'IN' and self.market_segment == 'XXX':
			#self.calculate_weight()
			  
			#self.check_weight()
			self.validate_load()
			if self.pot:
				self.validate_pot()
			if self.purchase_order:
				self.validate_qty_in()
			else:
				frappe.throw('无采购订单信息')
		#采购收货处理逻辑结束purchase receipt process logic end

		#销售出货处理逻辑开始sales shipment process logic start
		if self.type == 'OUT' and self.market_segment == 'XXX':
			#self.calculate_weight()
			#self.check_weight()
			self.validate_load()
			if self.sales_order:
				self.validate_qty_out()

			else:
				frappe.throw('无销售订单信息')
		#销售出货处理逻辑开始sales shipment process logic end

		#销售直送处理逻辑开始sales direct process logic start
		if self.type == 'DIRC' and self.market_segment == 'XXX':
			#self.calculate_weight()
			#self.check_weight()
			self.validate_load()
			if self.sales_order and self.purchase_order:
				self.validate_qty_in()
				self.validate_qty_out()
			else:
				frappe.throw('无销售订单或者采购订单信息')
		#销售直送处理逻辑开始sales direct process logic end
	
	def on_update(self):
		if self.docstatus == 0:
			self.submit()
	
	def on_update_after_submit(self):
		pass

	def before_update_after_submit(self):
		if self.market_segment == '粮食':
			if self.type == 'IN' and self.offload_net_weight and self.price_ls and not self.amount_ls:
				self.amount_ls = self.offload_net_weight * self.price_ls
			if self.type == 'OUT' and self.load_net_weight and self.price_ls and not self.amount_ls:
				self.amount_ls = self.load_net_weight * self.price_ls
		#frappe.msgprint("before_update_after_submit")
		self.change_status()
		self.validate_status()
  
		if self.type == 'IN' and self.market_segment == 'XXX':
			#self.calculate_weight()
			#self.check_weight()
			if self.pot:
				self.validate_pot()
			print("validate pot")
			

		
		if self.type == 'OUT' and self.market_segment == 'XXX':
			#self.calculate_weight()
			#self.check_weight()
			#self.validate_status()
			pass

		if self.type == 'DIRC' and self.market_segment == 'XXX':
			#self.calculate_weight()
			#self.check_weight()
			#self.validate_status()
			pass

				#get original target weight of the scale item
		old_doc = self.get_doc_before_save()
		old_target_weight = old_doc.target_weight
		if self.target_weight != old_target_weight:
			self.update_order_scale_weight()
	
	def on_submit(self):
		
		#create notification sms
		#first get driver phone number
		if self.driver:
			driver_doc = frappe.get_doc("Driver", self.driver)
			if self.cell_number and driver_doc.recv_sms:
				self.send_notification_sms()
		
		if self.purchase_order and self.target_weight:
			purchase_order = frappe.get_doc("Purchase Order", self.purchase_order,ignore_permissions=True)
			purchase_order.qty_vehicle  = purchase_order.qty_vehicle + self.target_weight
			purchase_order.save(ignore_permissions=True)

		if self.sales_order and self.target_weight:
			sales_order = frappe.get_doc("Sales Order", self.sales_order,ignore_permissions=True)
			sales_order.qty_vehicle  = sales_order.qty_vehicle + self.target_weight
			sales_order.save(ignore_permissions=True)

		if self.sales_invoice and self.target_weight:
			sales_invoice = frappe.get_doc("Sales Invoice", self.sales_invoice,ignore_permissions=True)
			sales_invoice.qty_vehicle  = sales_invoice.qty_vehicle + self.target_weight
			sales_invoice.save(ignore_permissions=True)

		if self.ship_plan:
			ship_plan = frappe.get_doc("Ship Plan", self.ship_plan,ignore_permissions=True)
			ship_plan.assigned_qty = ship_plan.assigned_qty + self.target_weight
			ship_plan.save(ignore_permissions=True)

		if self.vehicle:
			#check if the vehicle is exist in the vehicle master
			if not frappe.db.exists("Vehicle", self.vehicle):
			#try:
			#	vehicle_doc = frappe.get_doc("Vehicle", self.vehicle,ignore_permissions=True)
			#except:
				#create new vehicle
				vehicle_doc = frappe.new_doc("Vehicle")
				vehicle_doc.license_plate = self.vehicle
				vehicle_doc.make = "未知"
				vehicle_doc.model = "未知"
				vehicle_doc.last_odometer = 0
				vehicle_doc.uom = "Litre"
				vehicle_doc.fuel_type = "Diesel"
				vehicle_doc.company = None
				vehicle_doc.insert(
					ignore_permissions=True, # ignore write permissions during insert
					ignore_links=True, # ignore Link validation in the document
					ignore_if_duplicate=True, # dont insert if DuplicateEntryError is thrown
					ignore_mandatory=True) # insert even if mandatory fields are not set
				vehicle_doc.db_set('company', None)
	
	def on_cancel(self):
		#get all users that have role of "Scale Manager"
		scale_manager = frappe.get_all("Has Role", filters={'role': 'Scale Manager Dummy'}, fields=['parent'])
		scale_manager_list = [item.parent for item in scale_manager]

		#if self.status[0] >= '3' and frappe.session.user != 'Administrator' and frappe.session.user not in scale_manager_list:
		#	frappe.throw(("当前状态无法取消！如果需要取消，请联系部门负责人！"), frappe.ValidationError)
		#else:
		if self.purchase_order:
			purchase_order = frappe.get_doc("Purchase Order", self.purchase_order,ignore_permissions=True)
			purchase_order.qty_vehicle  = purchase_order.qty_vehicle - self.target_weight
			purchase_order.save(ignore_permissions=True)
		if self.sales_order:
			sales_order = frappe.get_doc("Sales Order", self.sales_order,ignore_permissions=True)
			sales_order.qty_vehicle  = sales_order.qty_vehicle - self.target_weight
			sales_order.save(ignore_permissions=True)
		if self.sales_invoice:
			sales_invoice = frappe.get_doc("Sales Invoice", self.sales_invoice,ignore_permissions=True)
			sales_invoice.qty_vehicle  = sales_invoice.qty_vehicle - self.target_weight
			sales_invoice.save(ignore_permissions=True)
		if self.ship_plan:
			ship_plan = frappe.get_doc("Ship Plan", self.ship_plan,ignore_permissions=True)
			ship_plan.assigned_qty = ship_plan.assigned_qty - self.target_weight
			ship_plan.save(ignore_permissions=True)
	
		self.status = "9 已取消"
   
	def before_cancel(self):
		self.status = "9 已取消"
		self.to_dt = frappe.utils.now()

def set_missing_values(source, target):
	target.run_method("set_missing_values")
	target.run_method("calculate_taxes_and_totals")


@frappe.whitelist()
def make_purchase_receipt(source_name, target_doc=None):
	source_doc = frappe.get_doc("Scale Item", source_name)	
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

	return doc

@frappe.whitelist()
def make_delivery_note(source_name, target_doc=None, skip_item_mapping=False):
	from erpnext.stock.doctype.packed_item.packed_item import make_packing_list

	source_doc = frappe.get_doc("Scale Item", source_name)
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

	return target_doc

@frappe.whitelist()
def save_scale_weight():
	try:
		id = frappe.form_dict.get('id')
		gross_weight = float(frappe.form_dict.get('gross_weight') if frappe.form_dict.get('gross_weight') !='' else 0)
		blank_weight = float(frappe.form_dict.get('blank_weight') if frappe.form_dict.get('blank_weight') !='' else 0)
		net_weight = float(frappe.form_dict.get('net_weight') if frappe.form_dict.get('net_weight')!='' else 0)
		blank_dt = frappe.form_dict.get('blank_dt')
		gross_dt = frappe.form_dict.get('gross_dt')
		frappe.log_error("gross_dt",gross_dt)
		doc=frappe.get_doc('Scale Item', id)
	
		if doc.type == 'IN':
			if gross_weight:
				doc.offload_gross_weight = gross_weight
			if blank_weight:
				doc.offload_blank_weight = blank_weight
			if net_weight:
				doc.offload_net_weight = net_weight
			if gross_dt:
				doc.offload_gross_dt = gross_dt
			if blank_dt:
				doc.offload_blank_dt = blank_dt	
	
			doc.save()
	
		elif doc.type == 'OUT':
			if gross_weight != 0:
				doc.load_gross_weight = gross_weight
			if blank_weight != 0:
				doc.load_blank_weight = blank_weight
			if net_weight != 0:
				doc.load_net_weight = net_weight
			if gross_dt:
				doc.load_gross_dt = gross_dt
			if blank_dt:
				doc.load_blank_dt = blank_dt	
	
			doc.save()
	
		elif type == 'TRAN':
			frappe.log_error("TRAN process")
	
		elif type == 'DRIC':
			frappe.log_error("TRAN process")
	
		frappe.response["message"] = {
			"status": "success",
			"ID":doc.name
		}
	
	except Exception as e:
		frappe.log_error('scale API update failed', str(e))
		frappe.response["message"] = {
			"status": "error",
			"message": str(e)
		}

@frappe.whitelist()
def get_scale_item():
	try:
		# Extract parameters from form_dict
		parent_warehouse = frappe.form_dict.get('parent_warehouse')
		checkall = frappe.form_dict.get('checkall')
		vehicle = frappe.form_dict.get('vehicle')
		
		# Fetch warehouse names based on parent_warehouse
		warehouse_query = "SELECT name FROM `tabWarehouse` WHERE parent_warehouse = %s"
		warehouses = frappe.db.sql(warehouse_query, (parent_warehouse,), as_dict=True)
		warehouse_names = [f"'{warehouse.name}'" for warehouse in warehouses]  # Wrap names in quotes
		
		frappe.log_error("warehouse list", warehouse_names)

		# Construct the WHERE clause based on checkall, warehouse_names, and vehicle
		status_conditions = ""
		if checkall == 'False':
			status_conditions = '((si.type = "IN" and si.status NOT IN ("6 已完成", "9 已取消", "5 已卸货")) OR (si.type = "OUT" and si.status IN ("0 新配","1 已配罐","2 正在装货")))'
		else:
			status_conditions = '(si.type IN ("IN", "OUT") and si.status NOT IN ("6 已完成", "9 已取消"))'
		
		# Embed the warehouse names directly into the warehouse_conditions string
		warehouse_conditions = f"si.pot IN ({', '.join(warehouse_names)})"
		
		# Add vehicle condition if it exists in form_dict
		vehicle_condition = f"AND si.vehicle = '{vehicle}'" if vehicle else ""
		
		combined_filter = f"{status_conditions} AND {warehouse_conditions} {vehicle_condition}"
		
		# SQL query to fetch scale items based on the combined filter
		scale_item_query = f"""
			SELECT
				si.desc,
				si.pot,
				i.item_name as item,
				si.date,
				si.vehicle,
				si.name as ID,
				d.full_name as driver,
				si.status,
				si.target_weight,
				si.type,
				si.load_net_weight,
				si.load_gross_weight,
				si.load_blank_weight,
				si.offload_net_weight,
				si.offload_gross_weight,
				si.offload_blank_weight,
				si.load_blank_dt,
				si.load_gross_dt,
				si.offload_gross_dt,
				si.offload_blank_dt,
				d.pid as driver_id
			FROM `tabScale Item` AS si
			LEFT JOIN `tabDriver` AS d ON si.driver = d.name
			LEFT OUTER JOIN `tabItem` AS i ON si.item = i.name
			WHERE {combined_filter}
		""" 
		
		scale_item = frappe.db.sql(scale_item_query, as_dict=True)

		# Return results
		frappe.response["message"] = {
			"status": "success",
			"items": scale_item
		}

	except Exception as e:
		frappe.log_error('details get failed', str(e))
		frappe.response["message"] = {
			"status": "error",
			"message": str(e)
		}



@frappe.whitelist(allow_guest=True)
def start_end_shipping(action, scale_item, mileage,image_base64, verification_code=None):
	try:
		
		scale_item_doc = frappe.get_doc("Scale Item", scale_item,ignore_permissions=True)
		""" if scale_item_doc.verification_code != verification_code:
			frappe.throw("验证码不正确")
			return """
	  
		if action == 'start':
			
			#except this scale item, check if there is any other scale item that not ended. please using field to_dt to check
			#from_dt has value but to_dt is null
			scale_item_query = f"""
				SELECT
					si.name
				FROM `tabScale Item` AS si
				WHERE si.name != '{scale_item}' AND si.from_dt IS NOT NULL AND si.to_dt IS NULL AND si.status != '9 已取消' AND si.driver = '{scale_item_doc.driver}'
				"""
			scale_item_list = frappe.db.sql(scale_item_query, as_dict=True)
			if scale_item_list:
				frappe.throw("还有其他物流单未结束，请先结束上一个物流单。")
	
			if scale_item_doc.from_dt:
				frappe.throw("出车时间已经设定，切勿重复操作")
			else:
				file_url = save_base64_image(image_base64, f"{scale_item}_start.png")
				scale_item_doc.from_dt = frappe.utils.now_datetime()
				scale_item_doc.mileage_start = mileage
				scale_item_doc.start_img = file_url
				

		elif action == 'end':
			
	  		#check if this scale item has already started
			if not scale_item_doc.from_dt:
				frappe.throw("请先开始物流单")
				return
			
	
			if scale_item_doc.to_dt:
				frappe.throw("出车时间已经设定，切勿重复操作")
			else:
				file_url = save_base64_image(image_base64, f"{scale_item}_end.png")
				scale_item_doc.to_dt = frappe.utils.now_datetime()
				scale_item_doc.mileage_end = mileage
				scale_item_doc.end_img = file_url
				scale_item_doc.verification_code = None
		scale_item_doc.save(ignore_permissions=True)
		frappe.response["message"] = {
			"status": "success"
		}
	except Exception as e:
		frappe.log_error('scale API update failed', str(e))
		frappe.response["message"] = {
			"status": "error",
			"message": str(e)
		}
  

def save_base64_image(base64_data, filename):
	# Decode the base64 string
	image_data = base64.b64decode(base64_data)
	image_buffer = BytesIO(image_data)
	image = Image.open(image_buffer)

	# Save the image to a file
	file_path = frappe.get_site_path('private', 'files', filename)
	image.save(file_path)

	# Create a File doc and link it to the specified Doctype
	file_url = '/private/files/' + filename
	file_doc = frappe.get_doc({
		'doctype': 'File',
		'file_name': filename,
		'file_url': file_url,
		'is_private': 1,
	})
	file_doc.insert(ignore_permissions=True)
	frappe.db.commit()
 

	return file_doc.file_url


@frappe.whitelist(allow_guest=True)
def get_verification_code(scale_item,cell_number):
	scale_item_doc = frappe.get_doc("Scale Item", scale_item)
	if scale_item_doc:
		#get driver phone number
		driver_phone_number = frappe.get_value("Driver", scale_item_doc.driver, "cell_number")
		if driver_phone_number and cell_number == driver_phone_number:
			if not scale_item_doc.verification_code:
				#generate verification code with number of 6 digits
				scale_item_doc.verification_code = ''.join(random.choices(string.digits, k=6))
				scale_item_doc.save(ignore_permissions=True)
			#generate a json list with the driver number
			driver_phone_number_list = json.dumps([driver_phone_number])
			variable_list = json.dumps([scale_item_doc.verification_code])
			#send sms to driver
			
			create_sms_log(scale_item_doc.company, "ship_verification_code", driver_phone_number_list, variable_list)
			print('send sms')
			frappe.response["message"] = {
				"status": "success",
				"message": "验证码已经发送"
			}
		else:
			frappe.response["message"] = {
				"status": "error",
				"message": "司机手机号码不匹配"
			}
	else:
		frappe.response["message"] = {
			"status": "error",
			"message": "没有找到物流单"
		}



