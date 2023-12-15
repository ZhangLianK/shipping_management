# Copyright (c) 2023, Alvin and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class ShippingFeeCalculation(Document):
	pass


@frappe.whitelist()
def refresh_ship_plan_fee(ship_plan=None,driver=None,from_date=None,to_date=None):
	if ship_plan:
		ship_plan_doc = frappe.get_doc("Ship Plan", ship_plan)
		#get represents company using supplier in ship plan
		represents_company = frappe.get_doc("Supplier", ship_plan_doc.supplier).represents_company
		#get shipping management setting doc
		shipping_management_setting = frappe.get_doc("Shipping Management Setting", 1)
		#get all scale item related to ship plan, status not equal to 'Cancelled'
		scale_item_list = frappe.get_all("Scale Item", 
										 filters={"ship_plan": ship_plan, "docstatus": ["!=", "2"]}, 
										 fields=["name","vehicle","from_dt","to_dt","tangbu","fanfee","yayunfee","fakuan","gaosufee","driver","mileage_start","mileage_end"])
	else:
     	#convert from_date to frappe datetime object
		from_date = frappe.utils.get_datetime(from_date)
		#convert to_date+1 to frappe datetime object
		to_date = frappe.utils.add_to_date(frappe.utils.get_datetime(to_date),days=1)
		print(from_date)
		print(to_date)
		scale_item_list = frappe.get_all("Scale Item", 
										 filters={"docstatus": ["!=", "2"], "driver": driver, "from_dt": [">=", from_date], "to_dt": ["<", to_date]}, 
										 fields=["name","vehicle","from_dt","to_dt","tangbu","fanfee","yayunfee","fakuan","gaosufee","driver","mileage_start","mileage_end"])
  
	for scale_item in scale_item_list:
		if scale_item.to_dt == None or scale_item.from_dt == None:
			days = 0
		else:
			#calculated the days between from_dt and to_dt, if not whole day, count as 1 day
			duration = scale_item.to_dt - scale_item.from_dt
			days = duration.days + duration.seconds / 3600 / 24
   
		scale_item.days = days
		scale_item.mileage = scale_item.mileage_end - scale_item.mileage_start
	
	#return the scale_item_list as dict
	return scale_item_list
