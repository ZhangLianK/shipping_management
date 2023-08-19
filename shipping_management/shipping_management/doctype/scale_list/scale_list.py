# Copyright (c) 2023, Alvin and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class ScaleList(Document):
	def before_save(self):
		#check if item is already in the scale list
		for item in self.items:
			if frappe.get_all("Scale List Items", filters={"scale_item": item.scale_item}, fields=["name"]):
				frappe.throw("物流单 {0} 已报号，不能重复报号".format(item.scale_item))



@frappe.whitelist()
def get_scale_list_items():
	#get the args from the request
	args = frappe.form_dict
	#get all scale items from doctype scale item where purchase order is equal to purchase order
	#and docstatus is 1 and not in any scale list's item
	#return the list of scale items
	scale_list_items = frappe.db.sql("""select `tabScale Item`.name, 
	       item, 
	       vehicle,
	       target_weight as qty,
	       d.full_name as driver,
	       d.pid as driver_id,
	       d.cell_number as phone
		from `tabScale Item` 
	       left outer join `tabDriver` d on `tabScale Item`.driver = d.name
	       where `tabScale Item`.purchase_order = %s 
	       and `tabScale Item`.docstatus = 1 
	       and `tabScale Item`.name not in (select scale_item from `tabScale List Items`)""", args.purchase_order, as_dict=1)
	
	return scale_list_items

	