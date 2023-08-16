# Copyright (c) 2023, Alvin and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.model.mapper import get_mapped_doc
from frappe.utils import cint, cstr, flt
from erpnext.setup.doctype.item_group.item_group import get_item_group_defaults
from erpnext.stock.doctype.item.item import get_item_defaults
from frappe.contacts.doctype.address.address import get_company_address
from frappe.model.utils import get_fetch_values
from frappe import _, msgprint

class ScaleItem(Document):

	def calculate_weight(self):
		if (not self.load_net_weight) and self.load_blank_weight and self.load_gross_weight:
			self.load_net_weight = self.load_gross_weight - self.load_blank_weight
		if (not self.offload_net_weight) and self.offload_blank_weight and self.offload_gross_weight:
			self.offload_net_weight = self.offload_gross_weight - self.offload_blank_weight

	def check_weight(self):
		if self.status == "3 已装货" and (self.load_gross_weight and self.load_blank_weight):
			if self.load_net_weight != (self.load_gross_weight - self.load_blank_weight):
				frappe.throw("装货净重不等于毛重减空重，请检查磅单信息")
		if self.status == "5 已卸货" and (self.offload_gross_weight and self.offload_blank_weight):
			if self.offload_net_weight != (self.offload_gross_weight - self.offload_blank_weight):
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
		purchase_order_doc = frappe.get_doc("Purchase Order", purchase_order)
		first_item_rate = purchase_order_doc.items[0].rate if purchase_order_doc.items else 0
	
		# Calculate the quantity that can be purchased with the total allocated amount
		qty = total_allocated_amount / first_item_rate if first_item_rate else 0
	
		total_qty_vehicle = self.target_weight + purchase_order_doc.qty_vehicle
	
		if total_qty_vehicle  > qty:
		
			frappe.throw(f"采购订单的总配车吨数:{total_qty_vehicle}超过已付款总量: {qty}")  

	def validate_qty_out(self):
		sales_invoice = frappe.get_doc('Sales Invoice', self.sales_invoice)
		#get all scale items doc related to this sales invoice except status is cancel
		#and then sum all target_weight
		scale_items = frappe.get_all("Scale Item", filters={'sales_invoice': self.sales_invoice, 'status': ['!=', '6 已取消']}, fields=['target_weight'])	
		total_qty = sum([scale_item.target_weight for scale_item in scale_items]) + self.target_weight
	
		if sales_invoice.items[0].qty  < total_qty:
			frappe.throw(f"总配车吨数超过销售费用清单 {self.sales_invoice} 的总量")

	def validate_load(self):
	#	vehicle_doc = frappe.get_doc('Vehicle',self.vehicle)
	#	if self.target_weight > vehicle_doc.load_capacity:
	#		frappe.throw(_(f"目标运输量超过核定载重量，请再次检查【目标运输量】"), frappe.CannotEditDocumentError)
		if not self.target_weight:
			frappe.throw(_(f"【计划运量】不能为0"))


	def validate_pot(self):
		item_code = self.item  # Replace with your actual item code
		warehouse = self.pot  # Assuming the warehouse name is in a field named 'warehouse'
	
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
	
			actual_qty = frappe.db.get_value("Bin", {"item_code": item_code, "warehouse": warehouse}, "actual_qty")
			warehouse_capacity =  frappe.db.get_value("Warehouse",{"name": warehouse},"capacity")

			if actual_qty is not None:
				if not self.is_new():
					ori_doc=  self.get_doc_before_save()
					ori_target_weight = ori_doc.target_weight
					if (actual_qty + total_target_qty - ori_target_weight + self.target_weight) > warehouse_capacity:
						frappe.throw(f'总入罐数量已经超过罐体容量： {warehouse_capacity}')
				else:
					if (actual_qty + total_target_qty + self.target_weight) > warehouse_capacity:
						frappe.throw(f'总入罐数量已经超过罐体容量： {warehouse_capacity}')
			else:
				frappe.msgprint('无相关库存信息，忽略罐容量检查')

	def validate_status(self):
		print("validate status")
		if not self.is_new():
			ori_doc=  self.get_doc_before_save()
			if (ori_doc.status[0] > self.status[0]):
				frappe.throw(_(f"无法从状态 '{ori_doc.status}' 修改为 '{self.status}' ！"), frappe.ValidationError)

	def before_save(self):
		#采购收货处理逻辑开始purchase receipt process logic start
		if self.type == 'IN':
			self.calculate_weight()
			self.change_status()  
			self.check_weight()
			self.validate_load()
			self.validate_pot()
			if self.purchase_order:
				self.validate_qty_in()
			else:
				frappe.throw('无采购订单信息')
		#采购收货处理逻辑结束purchase receipt process logic end

		#销售出货处理逻辑开始sales shipment process logic start
		if self.type == 'OUT':
			self.calculate_weight()
			self.change_status()
			self.check_weight()
			self.validate_load()
			if self.sales_order:
				self.validate_qty_out()

			else:
				frappe.throw('无销售订单信息')
		#销售出货处理逻辑开始sales shipment process logic end

		#销售直送处理逻辑开始sales direct process logic start
		if self.type == 'DIRC':
			self.calculate_weight()
			self.change_status()
			self.check_weight()
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
		self.validate_pot()
		print("von update alidate pot")

	def before_update_after_submit(self):
		if self.type == 'IN':
			self.calculate_weight()
			self.change_status()
			self.check_weight()
			self.validate_pot()
			print("validate pot")
			self.validate_status()
		
		if self.type == 'OUT':
			self.calculate_weight()
			self.change_status()
			self.check_weight()
			self.validate_status()

		if self.type == 'DIRC':
			self.calculate_weight()
			self.change_status()
			self.check_weight()
			self.validate_status()
	
	def on_submit(self):
		if self.purchase_order:
			purchase_order = frappe.get_doc("Purchase Order", self.purchase_order)
			purchase_order.qty_vehicle  = purchase_order.qty_vehicle + self.target_weight
			purchase_order.save()

		if self.sales_order:
			sales_order = frappe.get_doc("Sales Order", self.sales_order)
			sales_order.qty_vehicle  = sales_order.qty_vehicle + self.target_weight
			sales_order.save()

		if self.sales_invoice:
			sales_invoice = frappe.get_doc("Sales Invoice", self.sales_invoice)
			sales_invoice.qty_vehicle  = sales_invoice.qty_vehicle + self.target_weight
			sales_invoice.save()
	
	def on_cancel(self):
		if self.status[0] >= '3' and frappe.session.user != 'Administrator':
			frappe.throw(("当前状态无法取消！"), frappe.ValidationError)
		else:
			if self.purchase_order:
				purchase_order = frappe.get_doc("Purchase Order", self.purchase_order)
				purchase_order.qty_vehicle  = purchase_order.qty_vehicle - self.target_weight
				purchase_order.save()

			if self.sales_order:
				sales_order = frappe.get_doc("Sales Order", self.sales_order)
				sales_order.qty_vehicle  = sales_order.qty_vehicle - self.target_weight
				sales_order.save()

			if self.sales_invoice:
				sales_invoice = frappe.get_doc("Sales Invoice", self.sales_invoice)
				sales_invoice.qty_vehicle  = sales_invoice.qty_vehicle - self.target_weight
				sales_invoice.save()
		
			self.status = "9 已取消"

def set_missing_values(source, target):
	target.run_method("set_missing_values")
	target.run_method("calculate_taxes_and_totals")


@frappe.whitelist()
def make_purchase_receipt(source_name, target_doc=None):
	source_doc = frappe.get_doc("Scale Item", source_name)
	def update_parent(obj, target,source_parent):
		print(target)
		target.scale_item = source_doc.name
		
	def update_item(obj, target, source_parent):
		print(source_doc)
		print(obj)
		print(target)
		print(source_parent)
		target.warehouse = source_doc.pot
		if	source_doc.type == 'IN':
			target.qty = flt(source_doc.offload_net_weight)
			target.stock_qty = flt(source_doc.offload_net_weight) * flt(obj.conversion_factor)
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
			target.base_amount = (
			flt(source_doc.load_net_weight) * flt(source.rate) 
		)
		if	source_doc.bill_type == 'SD':
			target.qty = flt(source_doc.offload_net_weight)
			target.amount = flt(source_doc.offload_net_weight)  * flt(source.rate)
			target.base_amount = (
			flt(source_doc.offload_net_weight) * flt(source.rate) 
		)

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
	
		parent_warehouse = frappe.form_dict.get('parent_warehouse')
		checkall = frappe.form_dict.get('checkall')
		warehouse_query = """
			SELECT name FROM `tabWarehouse` WHERE parent_warehouse = %s
		"""
		warehouses = frappe.db.sql(warehouse_query, (parent_warehouse,), as_dict=True)
		warehouse_names = [warehouse.name for warehouse in warehouses]
		frappe.log_error("warehouse list" , warehouse_names)

		scale_item_list = []
		for warehouse_name in warehouse_names:
			if  checkall == 'False':
				scale_item_query = """
					SELECT
						si.desc,
						si.pot,
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
					WHERE
						 ((si.type = "IN" and si.status NOT IN ("6 已完成", "9 已取消", "5 已卸货"))
						 OR
						 (si.type = "OUT" and si.status IN ("0 新配","1 已配罐")))
						AND si.pot = %s
				"""
			else:
				scale_item_query = """
					SELECT
						si.desc,
						si.pot,
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
					WHERE
						 (si.status NOT IN ("6 已完成", "9 已取消"))
						AND si.pot = %s
				""" 
			scale_item = frappe.db.sql(scale_item_query, (warehouse_name,), as_dict=True)
			scale_item_list.extend(scale_item)

		frappe.response["message"] = {
			"status": "success",
			"items": scale_item_list
		}

	except Exception as e:
		frappe.log_error('details get failed', str(e))
		frappe.response["message"] = {
			"status": "error",
			"message": str(e)
		}
