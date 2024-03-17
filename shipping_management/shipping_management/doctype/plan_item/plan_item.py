# Copyright (c) 2024, Alvin and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document

class PlanItem(Document):
    
	def before_validate(self):
		if self.ship_plan:
			self.stauts = "计划中"


