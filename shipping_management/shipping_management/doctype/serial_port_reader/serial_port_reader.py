# Copyright (c) 2023, Alvin and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class SerialPortReader(Document):
	pass

@frappe.whitelist()
def save_weight(scale_item=None, gross_weight=None, gross_dt=None, blank_weight=None, blank_dt=None, net_weight=None,pot=None,type=None, market_segment=None,
                vehicle = None,
                item_code=None):
	try:
		if not scale_item:
			#add new scale item
			scale_item_doc = frappe.new_doc("Scale Item")
			if type == 'IN':
				if not gross_weight=='0':
					scale_item_doc.offload_gross_weight = gross_weight
				if gross_dt:
					scale_item_doc.offload_gross_dt = gross_dt
				if not blank_weight == '0':
					scale_item_doc.offload_blank_weight = blank_weight
				if blank_dt:
					scale_item_doc.offload_blank_dt = blank_dt
				if not net_weight == '0':
					scale_item_doc.offload_net_weight = net_weight
				if pot:
					scale_item_doc.pot=pot
				scale_item_doc.market_segment = market_segment
				scale_item_doc.type = type
				scale_item_doc.vehicle = vehicle
				scale_item_doc.date = frappe.utils.today()
				scale_item_doc.item = item_code
				scale_item_doc.save(ignore_permissions=True)
				return {"scale_item": scale_item_doc.name, "status": "success"}
			elif type == 'OUT':
				if not gross_weight == '0':
					scale_item_doc.load_gross_weight = gross_weight
				if gross_dt:
					scale_item_doc.load_gross_dt = gross_dt
				if not blank_weight == '0':
					scale_item_doc.load_blank_weight = blank_weight
				if blank_dt:
					scale_item_doc.load_blank_dt = blank_dt
				if not net_weight == '0':
					scale_item_doc.load_net_weight = net_weight
				if pot:
					scale_item_doc.pot=pot
				scale_item_doc.market_segment = market_segment
				scale_item_doc.type = type
				scale_item_doc.date = frappe.utils.today()
				scale_item_doc.vehicle = vehicle
				scale_item_doc.item = item_code
				scale_item_doc.save(ignore_permissions=True)
				return {"scale_item": scale_item_doc.name, "status": "success"}
		else:
			scale_item_doc = frappe.get_doc("Scale Item", scale_item)
			if scale_item_doc.type == 'IN':
				if not gross_weight == '0':
					scale_item_doc.offload_gross_weight = gross_weight
				if gross_dt:
					scale_item_doc.offload_gross_dt = gross_dt
				if not blank_weight == '0':
					scale_item_doc.offload_blank_weight = blank_weight
				if blank_dt:
					scale_item_doc.offload_blank_dt = blank_dt
				if not net_weight== '0':
					scale_item_doc.offload_net_weight = net_weight
				if pot:
					scale_item_doc.pot=pot
				scale_item_doc.save(ignore_permissions=True)
			elif scale_item_doc.type == 'OUT':
				if not gross_weight == '0':
					scale_item_doc.load_gross_weight = gross_weight
				if gross_dt:
					scale_item_doc.load_gross_dt = gross_dt
				if not blank_weight=='0':
					scale_item_doc.load_blank_weight = blank_weight
				if blank_dt:
					scale_item_doc.load_blank_dt = blank_dt
				if not net_weight=='0':
					scale_item_doc.load_net_weight = net_weight
				if pot:
					scale_item_doc.pot=pot
				scale_item_doc.save(ignore_permissions=True)
			return {"status": "success"}
	except Exception as e:
		return e
