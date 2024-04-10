# Copyright (c) 2023, Alvin and contributors
# For license information, please see license.txt
import frappe


def execute(filters=None):
	columns, data = [], []
	columns = get_columns()
	conditions = get_conditions(filters)

	data = get_data(conditions, filters)

	return columns, data


def get_conditions(filters):
    conditions = ""
    if filters.get("company"):
        conditions = conditions + f"where sci.docstatus != 2 and sci.company = '{filters.company}'"

    if filters.get("vehicle"):
        conditions = conditions + f" and sci.vehicle = '{filters.vehicle}'"

    if filters.get("date_from"):
        conditions = conditions + f" and sci.date >= '{filters.date_from}'"
    
    if filters.get("date_to"):
        conditions = conditions + f" and sci.date <= '{filters.date_to}'" 

    if filters.get("status"):
        conditions = conditions + f" and sci.status = '{filters.status}'"
    
    if filters.get("transporter"):
        conditions = conditions + f" and sci.transporter = '{filters.transporter}'"
    
    if filters.get("purchase_order"):
        conditions = conditions + f" and sci.purchase_order = '{filters.purchase_order}'"
    
    if filters.get("sales_order"):
        conditions = conditions + f" and sci.sales_order = '{filters.sales_order}'"
    
    if filters.get("ship_plan"):
         conditions = conditions + f" and (vpi.ship_plan = '{filters.ship_plan}' or sci.ship_plan = '{filters.ship_plan}')"
        
    if filters.get("stock_dt_from"):
        conditions = conditions + f" and sci.stock_dt >= '{filters.stock_dt_from}'"
    
    if filters.get("stock_dt_to"):
        conditions = conditions + f" and sci.stock_dt <= '{filters.stock_dt_to}'"
    
    if filters.get("pot"):
        conditions = conditions + f" and sci.pot = '{filters.pot}'"
    
    if filters.get("type"):
        conditions = conditions + f" and sci.type = '{filters.type}'"
    
    if filters.get("market_segment"):
        conditions = conditions + f" and sci.market_segment = '{filters.market_segment}'"
    
    if filters.get("vehicle_plan"):

        conditions = conditions + f" and sci.vehicle_plan = '{filters.vehicle_plan}'"

        
    #check user permissions set for this user againest parent warehouse and get all child warehouses
    parent_warehouses = frappe.get_all("User Permission", filters={"user": frappe.session.user, "allow": "Warehouse"}, pluck="for_value")
    warehouses=[]
    if parent_warehouses:
        for parent_warehouse in parent_warehouses:
            warehouses_doc = frappe.get_doc("Warehouse", parent_warehouse)
            warehouses += frappe.get_all("Warehouse", filters={"lft": (">", warehouses_doc.lft), "rgt": ("<", warehouses_doc.rgt)}, pluck="name")
        if warehouses:
           if len(warehouses) > 1:
               warehouses = tuple(warehouses)
               conditions = conditions + f" and sci.pot in {warehouses}"
           else:
               conditions = conditions + f" and sci.pot = '{warehouses[0]}'"

    return conditions


def get_data(conditions, filters):

    data = frappe.db.sql(
        f"""
		select
		    sci.name,
            sci.desc,
            s.title as type,
            sci.date,
            sci.vehicle,
            sci.transporter,
            sci.driver,
            d.full_name as driver_name,
            sci.status,
            sci.company,
            i.title as bill_type,
            sci.item,
            sci.pot,
            sci.target_weight,
            sci.load_net_weight,
            sci.offload_net_weight,
            sci.offload_net_weight - sci.load_net_weight as net_variance,
            sci.load_gross_weight,
            sci.offload_gross_weight,
            sci.load_blank_weight,
            sci.offload_blank_weight,
            sci.purchase_order,
            sci.purchase_receipt,
            sci.sales_order,
            sci.sales_invoice,
            sci.delivery_note,
            if(vpi.ship_plan='' OR vpi.ship_plan IS NULL,sci.ship_plan,vpi.ship_plan) as ship_plan,
            sci.stock_dt,
            sci.from_addr,
            sci.to_addr

        from `tabScale Item`  sci
        left outer join `tabVehicle Plan Item` vpi
            on sci.vehicle_plan = vpi.name
        left outer join `tabDriver` d
            on sci.driver = d.name
        left outer join `tabShip Type` s
            on sci.type = s.name
        left outer join `tabScale Type` i
            on sci.bill_type = i.name

        {conditions}
        
	""",
        as_dict=True,
    )

    return data

def get_columns():
	columns = [
  {
   "fieldname": "name",
   "fieldtype": "Link",
   "label": "\u5355\u53f7",
   "options": "Scale Item",
   "width": 0
  },
  {
   "fieldname": "desc",
   "fieldtype": "Data",
   "label": "\u63cf\u8ff0",
   "width": 0
  },
  {
   "fieldname": "type",
   "fieldtype": "Data",
   "label": "\u7c7b\u578b",
   "width": 0
  },
  {
   "fieldname": "date",
   "fieldtype": "Date",
   "label": "\u65e5\u671f",
   "width": 0
  },
  {
   "fieldname": "stock_dt",
   "fieldtype": "Datetime",
   "label": "\u5165\u51fa\u5e93\u65f6\u95f4",
   "width": 0
  },
  {
   "fieldname": "vehicle",
   "fieldtype": "Link",
   "label": "\u8f66\u53f7",
   "options": "Vehicle",
   "width": 0
  },
 {
   "fieldname": "ship_plan",
   "fieldtype": "Link",
   "label": "\u7269\u6d41\u8ba1\u5212",
   "options": "Ship Plan",
   "width": 0
  },
  {
   "fieldname": "transporter",
   "fieldtype": "Data",
   "label": "\u627f\u8fd0\u5546",
   "width": 0
  },
  {
   "fieldname": "driver_name",
   "fieldtype": "Data",
   "label": "\u53f8\u673a",
   "width": 0
  },
  {
   "fieldname": "status",
   "fieldtype": "Data",
   "label": "\u72b6\u6001",
   "width": 0
  },
  {
   "fieldname": "bill_type",
   "fieldtype": "Data",
   "label": "\u81ea\u63d0/\u9001\u5230",
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
   "fieldname": "pot",
   "fieldtype": "Data",
   "label": "\u7f50",
   "width": 0
  },
  {
   "fieldname": "target_weight",
   "fieldtype": "Float",
   "label": "\u8ba1\u5212\u8fd0\u91cf",
   "width": 0
  },
  {
   "fieldname": "load_net_weight",
   "fieldtype": "Float",
   "label": "\u88c5\u8f66\u51c0\u91cd",
   "width": 0
  },
  {
   "fieldname": "offload_net_weight",
   "fieldtype": "Float",
   "label": "\u5378\u8f66\u51c0\u91cd",
   "width": 0
  },
  {
   "fieldname": "net_variance",
   "fieldtype": "Float",
   "label": "\u51c0\u91cd\u76c8\u4e8f",
   "width": 0
  },
    {
   "fieldname": "load_gross_weight",
   "fieldtype": "Float",
   "label": "\u88c5\u8f66\u6bdb\u91cd",
   "width": 0
  },
  {
   "fieldname": "load_blank_weight",
   "fieldtype": "Float",
   "label": "\u88c5\u8f66\u76ae\u91cd",
   "width": 0
  },
  {
   "fieldname": "offload_gross_weight",
   "fieldtype": "Float",
   "label": "\u5378\u8f66\u6bdb\u91cd",
   "width": 0
  },
  {
   "fieldname": "offload_blank_weight",
   "fieldtype": "Float",
   "label": "\u5378\u8f66\u76ae\u91cd",
   "width": 0
  },
  {
   "fieldname": "purchase_order",
   "fieldtype": "Link",
   "label": "\u91c7\u8d2d\u8ba2\u5355",
   "options": "Purchase Order",
   "width": 0
  },
  {
   "fieldname": "purchase_receipt",
   "fieldtype": "Link",
   "label": "\u91c7\u8d2d\u6536\u8d27\u5355",
   "options": "Purchase Receipt",
   "width": 0
  },
  {
   "fieldname": "sales_order",
   "fieldtype": "Link",
   "label": "\u9500\u552e\u8ba2\u5355",
   "options": "Sales Order",
   "width": 0
  },
  {
   "fieldname": "sales_invoice",
   "fieldtype": "Link",
   "label": "\u9500\u552e\u8d39\u7528\u6e05\u5355",
   "options": "Sales Invoice",
   "width": 0
  },
  {
   "fieldname": "delivery_note",
   "fieldtype": "Link",
   "label": "\u9500\u552e\u51fa\u8d27\u5355",
   "options": "Delivery Note",
   "width": 0
  },

  {
   "fieldname": "from_addr",
   "fieldtype": "Data",
   "label": "\u63d0\u8d27\u5730",
   "width": 0
  },
  {
   "fieldname": "to_addr",
   "fieldtype": "Data",
   "label": "\u9001\u8d27\u5730",
   "width": 0
  }
  
 ]
        
	return columns

