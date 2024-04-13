# Copyright (c) 2024, Alvin and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class ScaleItemCreator(Document):
	pass


@frappe.whitelist()
def create_scale_item():
	args = frappe.form_dict
	#create scale items from the args
	doc = frappe.new_doc("Scale Item")
	doc.update(args)
	doc.save()
	return doc