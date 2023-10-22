# Copyright (c) 2023, Alvin and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe import _, msgprint


class TransportFee(Document):
	def validate(self):
		self.validate_details()

	def validate_details(self):
		for item in self.items:
			scale_item = frappe.get_doc("Scale Item",item.scale_item)
			if scale_item.transport_fee:
				frappe.throw(_(f"明细行：{item.idx} 已经做过费用结算，请再次核对"))

	def on_submit(self):
		self.update_scale_item()
	
	def update_scale_item(self):
		for item in self.items:
			scale_item = frappe.get_doc("Scale Item",item.scale_item)
			scale_item.transport_fee = self.name
			scale_item.save(ignore_permissions=True)
	
	def on_cancel(self):
		self.cancel_scale_item()
	
	def cancel_scale_item(self):
		for item in self.items:
			scale_item = frappe.get_doc("Scale Item",item.scale_item)
			scale_item.transport_fee = None
			scale_item.save(ignore_permissions=True)

	pass



@frappe.whitelist()
def get_scale_item_to_clear():
	try:
		start_date = frappe.form_dict.get('start_date')
		end_date = frappe.form_dict.get('end_date')
		transporter = frappe.form_dict.get('transporter')
		company = frappe.form_dict.get('company')
			
		scale_items = frappe.get_all(
			'Scale Item',
			fields=["date", "vehicle", "offload_net_weight", "name","target_weight","load_net_weight","price"],
			filters={
				"date": ["between", (start_date, end_date)],
				"status": "6 已完成",
				"transporter": transporter,
				"ifnull(transport_fee, '')": ["=", ""],
				"company": company
			}
		)

		items = []
			
		for scale_item in scale_items:
			item = {
				"date": scale_item.date,
				"vehicle": scale_item.vehicle,
				"qty": scale_item.target_weight,
				"price": scale_item.price,
				"scale_item": scale_item.name,
				"load_net_weight":scale_item.load_net_weight,
				"offload_net_weight":scale_item.offload_net_weight,
				"variance": scale_item.offload_net_weight - scale_item.load_net_weight
				}
			items.append(item)
			
		total_qty = sum(item['qty'] for item in items)
		total_amount = sum(item['price']*item['qty'] for item in items)
		loss_weight = sum(item['variance'] for item in items if item['variance'] < 0)
			
		frappe.response["message"] = {
			"status": "success",
			"items": items,
			"total_qty": total_qty,
			"loss_weight":loss_weight,
			"total_amount": total_amount
		}

	except Exception as e:
		frappe.log_error('details get failed', str(e))
		frappe.response["message"] = {
			"status": "error",
			"message": str(e)
		}
