# Copyright (c) 2023, Alvin and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class ShippingManagementTool(Document):
	pass

@frappe.whitelist()
def get_scale_child(vehicle):
    # Fetch the 'standard_qty' from the Vehicle DocType
    vehicle_doc = frappe.get_doc('Vehicle', vehicle)
    standard_qty = vehicle_doc.standard_qty  # assuming 'standard_qty' is a field in 'Vehicle'

    # Assuming this function is called from a client script where 'from_addr' and 'to_addr' are available
    # as part of the form context.
    #from_addr = frappe.form_dict.from_addr
    #to_addr = frappe.form_dict.to_addr

    # Create the Scale Child doc
    scale_child = frappe.new_doc('Scale Child')
    scale_child.vehicle = vehicle
    scale_child.qty = standard_qty
    scale_child.driver = vehicle_doc.driver
    scale_child.scale_item = 'N'
    #scale_child.from_addr = from_addr
    #scale_child.to_addr = to_addr

    # You may want to fetch more details or set more fields depending on your requirements.

    return scale_child.as_dict()  # Return the doc as a dictionary to the client

@frappe.whitelist()
def save_doc(doc_data):
    try:
        #parse the json to a python object
        data = frappe.parse_json(doc_data)
        # Check if the DocType is specified in the JSON
        if not data.get('doctype'):
            raise ValueError("JSON data must include 'doctype' field.")

        # Create a new Document object from the dictionary
        doc = frappe.get_doc(data)


        # get the ship plan infor according to doc.ship_plan
        ship_plan = frappe.get_doc('Ship Plan', doc.ship_plan)


        #for each scale_child in the doc.scale_child: if scale_item is blank, create new scale item
        #if scale_item is not blank, update scale item
        for scale_child in doc.scale_child:
            if not scale_child.scale_item == 'N':
                scale_item = frappe.get_doc('Scale Item', scale_child.scale_item)
                scale_item.target_weight = scale_child.qty
                scale_item.from_addr = scale_child.from_addr
                scale_item.to_addr = scale_child.to_addr
                scale_item.save()
            else:
                scale_item = frappe.new_doc('Scale Item')
                scale_item.company = ship_plan.company
                scale_item.transporter = ship_plan.supplier
                scale_item.driver = scale_child.driver
                scale_item.vehicle = scale_child.vehicle
                scale_item.date = ship_plan.date
                scale_item.target_weight = scale_child.qty
                scale_item.bill_type = ship_plan.bill_type
                scale_item.purchase_order = ship_plan.purchase_order
                scale_item.sales_order = ship_plan.sales_order
                scale_item.type = ship_plan.type
                scale_item.desc= ship_plan.plan_desc
                scale_item.ship_plan = ship_plan.name
                scale_item.from_addr = ship_plan.from_addr
                scale_item.to_addr = ship_plan.to_addr
                scale_item.price= ship_plan.price
                scale_item.item = ship_plan.item
                scale_item.save()
                scale_child.scale_item = scale_item.name

        # get all scale item related to this ship plan and not cancelled
        scale_items = frappe.get_all('Scale Item', filters={'ship_plan': doc.ship_plan, 'docstatus': ['!=', '2']}, fields=['name'])
        if scale_items:
            #check every scale item if it exist in the scale_child, if not, cancel the scale item
            for scale_item in scale_items:
                scale_item_doc = frappe.get_doc('Scale Item', scale_item.name)
                if not scale_item_doc.name in [scale_child.scale_item for scale_child in doc.scale_child]:
                    scale_item_doc.cancel()

        update_ship_plan(doc)   
        return doc.as_dict()
    except Exception as e:
        frappe.log_error('Shipping Management Tool Save Doc',frappe.get_traceback())
        raise e


@frappe.whitelist()
def get_scale_childs(ship_plan):
    # fetch all scale item doc according to ship_plan
    scale_items = frappe.get_all('Scale Item', filters={'ship_plan': ship_plan, 'docstatus': ['!=', '2']}, fields=['name', 'vehicle', 'driver', 'target_weight','status','from_addr','to_addr'])
    #get id of vehicle of every scale item
    for scale_item in scale_items:
        vehicle = frappe.get_doc('Vehicle', scale_item.vehicle)
        scale_item.id = vehicle.id
    # return the scale_items as a list of dictionaries
    return scale_items

def update_ship_plan(doc):
    # check if there is any scale item related to this ship plan
    scale_items = frappe.get_all('Scale Item', filters={'ship_plan': doc.ship_plan}, fields=['name'])
    # get the ship plan doc
    ship_plan_doc = frappe.get_doc('Ship Plan', doc.ship_plan)
    ship_plan_doc.assigned_qty = doc.assigned_qty
    if scale_items:
        # update the status of the ship plan
        ship_plan_doc.status = '进行中'
        #calculate the total target weight and compare to ship plan qty
        #and all scale item status equals to '6 已完成' or '9 已取消'
        total_target_weight = 0
        overall_status = True
        for scale_item in scale_items:
            scale_item_doc = frappe.get_doc('Scale Item', scale_item.name)
            total_target_weight += scale_item_doc.target_weight
            if scale_item.status != '6 已完成' and scale_item.status != '9 已取消':
                overall_status = False
                break
        if total_target_weight == ship_plan_doc.qty and overall_status:
            ship_plan_doc.status = '完成'
            ship_plan_doc.save(ignore_permissions=True)
            
    ship_plan_doc.save()