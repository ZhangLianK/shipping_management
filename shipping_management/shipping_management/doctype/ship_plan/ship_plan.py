# Copyright (c) 2023, Alvin and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class ShipPlan(Document):
	def update_assigned_qty(self):
		#get all vehicle plan items linked to this ship plan
		vehicle_plan_items = frappe.get_all("Vehicle Plan Item", filters={"ship_plan": self.name}, fields=["assigned_qty"])
		#update the assigned qty of the ship plan
		self.assigned_qty = sum([item.assigned_qty for item in vehicle_plan_items])
		direct_items = frappe.get_all("Scale Item",filters={"ship_plan": self.name, "vehicle_plan":["is", "not set"],"docstatus": ["!=", "2"]},
		fields=["target_weight"])
		direct_assigned_qty = sum(item.target_weight for item in direct_items if item.target_weight is not None)
		# self.assigned_qty = vehicle_plan_items.assigned_qty + direct_assigned_qty
		self.assigned_qty += direct_assigned_qty
		self.save()

	def before_validate(self):
		#clear all child tables
		self.plan_items_v = []
		self.vehicle_plans = []
		self.plan_items = []


@frappe.whitelist()
def get_vehicle_plan(transporter):
	return frappe.db.sql("""SELECT name, req_qty, assigned_qty, plan_desc,status,date,ship_plan FROM `tabVehicle Plan Item` WHERE 
						 status != '完成' and transporter = %s""", (transporter), as_dict=1)


@frappe.whitelist()
def get_vehicle_plan_detail(vehicle_plan):
	return frappe.db.sql("""SELECT `tabVehicle Plan`.name, 
					  `tabVehicle Plan`.parent,
					  `tabVehicle Plan`.req_qty, 
					  `tabVehicle Plan`.assigned_qty, 
					  `tabVehicle Plan`.qty,
					  `tabVehicle Plan`.plan_desc,
					  `tabVehicle Plan`.status,
					  `tabVehicle Plan`.date,
					  `tabShip Plan`.baohao_template FROM `tabVehicle Plan`
					  LEFT JOIN `tabShip Plan` ON `tabVehicle Plan`.parent = `tabShip Plan`.name
					  WHERE 
						 `tabVehicle Plan`.name = %s LIMIT 1""", (vehicle_plan), as_dict=1)
 
 
@frappe.whitelist()
def get_vehicle_plan_for_fen():
	return frappe.db.sql("""SELECT name, parent,req_qty, assigned_qty, plan_desc,status,date FROM `tabVehicle Plan` WHERE 
						 status = '进行中' OR status = '报号已完成'""", as_dict=1)
	
	
@frappe.whitelist()
def get_filtered_sales_orders(doctype, txt, searchfield, start, page_len, filters):
	import json
	if isinstance(filters, str):
		filters = json.loads(filters)

	ship_plan = filters.get('ship_plan') if filters else None
	permitted_companies = get_user_permitted_companies()

	# Convert start and page_len to integers
	start = int(start)
	page_len = int(page_len)

	# Prepare the SQL query, including a filter for permitted companies
	sales_order_fields = "`tabPlan Item`.`name`, `tabSales Order`.`order_note`, `tabPlan Item`.`to_addr`,`tabPlan Item`.`v_qty`,`tabSales Order`.`name` as `sales_order`"

	company_conditions = ""
	if permitted_companies:
		company_placeholders = ', '.join(['%s'] * len(permitted_companies))
		company_conditions = f"AND `tabSales Order`.`company` IN ({company_placeholders})"

	results = frappe.db.sql(f"""
		SELECT DISTINCT {sales_order_fields}
		FROM `tabPlan Item`
		INNER JOIN `tabSales Order` ON `tabPlan Item`.`sales_order` = `tabSales Order`.`name`
		WHERE `tabSales Order`.`docstatus` = 1
		AND `tabSales Order`.`status` NOT IN ('Completed', 'Closed', 'Cancelled')
		AND (`tabPlan Item`.`bill_type` IN ('ZT', ''))
		AND `tabPlan Item`.`status` IN ('计划中', '进行中')
		AND (`tabSales Order`.`{searchfield}` LIKE %s OR `tabSales Order`.`order_note` LIKE %s)
		AND (%s IS NULL OR `tabPlan Item`.`ship_plan` = %s)
		{company_conditions}
		ORDER BY
			`tabSales Order`.`modified` DESC
	""", [
		f"%{txt}%", f"%{txt}%", ship_plan, ship_plan
	] + permitted_companies)

	return results


		
def get_user_permitted_companies():
	"""Fetch a list of companies the user has permission to access."""
	user = frappe.session.user
	# Fetch the companies the user has permission to access
	companies = frappe.db.get_all('User Permission', filters={'user': user, 'allow': 'Company'}, pluck='for_value')
	#if companies is none return [], else return the companies
	return companies if companies else []


@frappe.whitelist()
def generate_vehicle_plan(plan_items, ship_plan):
	import json
	plan_items = json.loads(plan_items)
	vehicle_plan = frappe.new_doc("Vehicle Plan Item")
	vehicle_plan.status = '未处理'
	vehicle_plan.ship_plan = ship_plan
	vehicle_plan.baohao_template = frappe.get_value("Ship Plan", ship_plan, "baohao_template")
	for plan_item in plan_items:
		vehicle_plan.date = plan_item.get('date')
		vehicle_plan.req_qty = (vehicle_plan.req_qty if vehicle_plan.req_qty else 0) + plan_item.get('qty')
	doc = vehicle_plan.save()
	
	for plan_item in plan_items:
		frappe.set_value("Plan Item", plan_item.get('plan_item'), "vehicle_plan", doc.name)
		frappe.set_value("Plan Item", plan_item.get('plan_item'), "status", "执行中")
	
	return 'success'