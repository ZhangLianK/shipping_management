# Copyright (c) 2023, Alvin and contributors
# For license information, please see license.txt
import frappe
from frappe.model.document import Document

class ScaleLoadLog(Document):

    #after save, update the scale item
	def on_update(self):
		scale_item_doc = frappe.get_doc("Scale Item",self.scale_item)
		if scale_item_doc.type == "IN" or scale_item_doc.type == "DIRC":
			if self.load_gross_weight:
				scale_item_doc.load_gross_weight = self.load_gross_weight
			if self.load_blank_weight:
				scale_item_doc.load_blank_weight = self.load_blank_weight
			if self.load_net_weight:	
				scale_item_doc.load_net_weight = self.load_net_weight
	
			if self.load_image_upload:
				scale_item_doc.load_image_upload = self.load_image_upload
	
			scale_item_doc.save(ignore_permissions=True)
	
""" 	def validate(self):
		#check the scale item's verification code is equal to the verification code from web form
		scale_item_doc = frappe.get_doc("Scale Item",self.scale_item)
		print(scale_item_doc.verification_code)
		print(self.verification_code)
		if scale_item_doc.verification_code != self.verification_code:
			frappe.throw("验证码错误，请重新输入！") """