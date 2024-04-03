# Copyright (c) 2024, Alvin and contributors
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
            sci.company,
		    sci.name,
            sci.bill_type,
            s.title as type,
            sci.date,
            sci.vehicle,
            sci.transporter,
            d.full_name as driver_name,
            sci.status,
            sci.target_weight,
            sci.item,
            sci.load_net_weight,
            sci.offload_net_weight,
            sci.offload_net_weight - sci.load_net_weight as net_variance,
            sci.from_addr,
            sci.to_addr,
            sci.price,
            sci.koukuan,
            sci.beizhu,
            sci.tangbu,
            sci.yayunfee,
            sci.yayun_price,
            sci.fanfee,
            sci.mileage_start,
            sci.mileage_end,
            sci.mileage_end - sci.mileage_start as mileage_true,
            a.card_number,
            sci.offload_net_weight * sci.price as amount_ls,
            sci.sales_order,
            sci.sales_invoice,
            sci.delivery_note,
            sci.pot,
            sci.ship_plan,
            sci.purchase_order,
            sci.purchase_receipt,
            sci.sales_order,
            sci.sales_invoice,
            sci.delivery_note,
            sci.order_note,
            sci.market_segment,
            sci.stock_dt
            

        from `tabScale Item`  sci 
        left outer join `tabDriver` d
            on sci.driver = d.name
        left outer join `tabShip Type` s
            on sci.type = s.name
        left outer join `tabScale Type` i
            on sci.bill_type = i.name
        left outer join `tabShip Plan` a
            on sci.company = a.company
        left outer join `tabDriver` v
            on sci.driver = v.full_name



        {conditions}
        
	""",
        as_dict=True,
    )

    return data

def get_columns():
	columns = [
  {
   "fieldname": "company",
   "fieldtype": "Link",
   "in_standard_filter": 1,
   "label": "\u516c\u53f8",
   "options": "Company",
   "reqd": 1
  },
  {
   "fieldname": "name",
   "fieldtype": "Link",
   "label": "\u5355\u53f7",
   "options": "Scale Item",
   "width": 0
  },

  {
   "fieldname": "date",
   "fieldtype": "Date",
   "label": "\u65e5\u671f",
   "width": 0
  },
  {
   "fieldname": "status",
   "fieldtype": "Data",
   "label": "\u72b6\u6001",
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
   "fieldname": "type",
   "fieldtype": "Data",
   "label": "\u7c7b\u578b",
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
   "fieldname": "from_addr",
   "fieldtype": "Data",
   "label": "\u63d0\u8d27\u5730",
   "width": 0
  },
  {
   "fieldname": "to_addr",
   "fieldtype": "Data",
   "label": "\u9001\u8d27\u5730",
   
  }
  ,
  {
   "fieldname": "net_variance",
   "fieldtype": "Float",
   "label": "\u51c0\u91cd\u76c8\u4e8f",
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
   "fieldname": "stock_dt",
   "fieldtype": "Datetime",
   "label": "\u5165\u51fa\u5e93\u65f6\u95f4",
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
   "fieldname": "card_number",
   "fieldtype": "Data",
   "label": "\u63d0\u8d27\u5c0f\u5361\u53f7"
  },
  {
   "fieldname": "ship_plan",
   "fieldtype": "Link",
   "label": "\u7269\u6d41\u8ba1\u5212",
   "options": "Ship Plan",
   "width": 0
  },
  {
   "allow_on_submit": 1,
   "fieldname": "beizhu",
   "fieldtype": "Data",
   "label": "\u5907\u6ce8"
  },
    {
   "allow_on_submit": 1,
   "fieldname": "market_segment",
   "fieldtype": "Link",
   "label": "\u4e8b\u4e1a\u90e8",
   "options": "Market Segment"
  },
    {
   "fieldname": "supplier_address",
   "fieldtype": "Data",
   "in_list_view": 1,
   "label": "\u4f9b\u8d27\u5355\u4f4d"
  },
    ]
	return columns