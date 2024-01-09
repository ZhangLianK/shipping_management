# Copyright (c) 2024, Alvin and contributors
# For license information, please see license.txt
import frappe
def get_conditions(filters):
	conditions = []

	if filters.get("company"):
		conditions.append("si.company = %(company)s")
	if filters.get("warehouse"):
		conditions.append("si.pot = %(warehouse)s")
	if filters.get("item"):
		conditions.append("si.item = %(item)s")

	return " AND ".join(conditions) if conditions else "1=1"

def get_data(filters):
	conditions = get_conditions(filters)

	query = f"""
		SELECT 
			si.company as company,
			si.pot as warehouse,
			si.item as item,
			SUM(CASE WHEN si.type = 'IN' THEN si.offload_net_weight ELSE 0 END) -
			SUM(CASE WHEN si.type = 'OUT' THEN si.load_net_weight ELSE 0 END) AS qty
		FROM 
			`tabScale Item` si
		WHERE 
			{conditions}
			AND si.docstatus != 2
		GROUP BY 
			si.company, si.pot, si.item
	"""

	data = frappe.db.sql(query, filters, as_dict=1)
	return data

def execute(filters=None):
	columns, data = [], []

	data = get_data(filters)
	columns = get_columns()

	return columns, data

def get_columns():
	columns = [
  {
   "fieldname": "company",
   "fieldtype": "Link",
   "label": "\u516c\u53f8",
   "options": "Company",
   "width": 0
  },
  {
   "fieldname": "warehouse",
   "fieldtype": "Link",
   "label": "\u5e93\u4f4d",
   "options": "Warehouse",
   "width": 0
  },
  {
   "fieldname": "item",
   "fieldtype": "Link",
   "label": "\u7269\u6599",
   "options": "Item",
   "width": 0
  },
  {
   "fieldname": "qty",
   "fieldtype": "Float",
   "label": "\u5e93\u5b58\u7ed3\u4f59\u91cf",
   "width": 0
  }
 ]
	return columns