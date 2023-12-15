# Copyright (c) 2023, Alvin and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class ScaleFee(Document):
	def on_update(self):
		scale_item_doc = frappe.get_doc("Scale Item",self.scale_item)
		if scale_item_doc:
			if self.tangbu:
				scale_item_doc.tangbu = self.tangbu
			if self.fanfee:
				scale_item_doc.fanfee = self.fanfee
			if self.yayunfee:	
				scale_item_doc.yayunfee = self.yayunfee
	
			if self.fakuan:
				scale_item_doc.fakuan = self.fakuan

			if self.gaosufee:
				scale_item_doc.gaosufee = self.gaosufee
	
			scale_item_doc.save(ignore_permissions=True)
