# Copyright (c) 2023, Alvin and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
import json

class ShippingManagementTool(Document):
	pass

@frappe.whitelist()
def save_scale_item(doc_data):
    try:
        #parse the json to a python object
        data = frappe.parse_json(doc_data)
        # Check if the DocType is specified in the JSON
        if not data.get('doctype'):
            raise ValueError("JSON data must include 'doctype' field.")
        
        # convert the data to a doctype object
        doc = frappe.get_doc(data)

        # Create a new Document object from the dictionary
        scale_doc = frappe.get_doc('Scale Item', doc.scale_item)
        
        #update the scale item information using the doc
        scale_doc.target_weight = doc.target_weight
        scale_doc.from_addr = doc.from_addr
        scale_doc.to_addr = doc.to_addr
        scale_doc.type = doc.type
        scale_doc.driver = doc.driver
        scale_doc.cell_number = doc.cell_number
        scale_doc.pot = doc.pot
        scale_doc.bill_type = doc.bill_type
        scale_doc.purchase_order = doc.purchase_order
        scale_doc.sales_order = doc.sales_order
        scale_doc.sales_invoice = doc.sales_invoice
        scale_doc.transporter = doc.transporter
        scale_doc.order_note = doc.order_note
        
        scale_doc.save(ignore_permissions=True)
        return 'success'
    except Exception as e:
        frappe.log_error('Shipping Management Tool Save Scale Item',frappe.get_traceback())
        raise e
    
@frappe.whitelist()
def cancel_scale_child(scale_item):
    scale_item_doc = frappe.get_doc('Scale Item', scale_item)
    scale_item_doc.cancel()
    #scale_item_doc.save(ignore_permissions=True)
    if scale_item_doc.vehicle_plan:
        vehicle_plan_doc = frappe.get_doc('Vehicle Plan Item', scale_item_doc.vehicle_plan, ignore_permissions=True)
        
    return {
        'status': 'success',
        'assigned_qty': vehicle_plan_doc.assigned_qty if scale_item_doc.vehicle_plan else 0,
        
        }
    

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
    scale_child.target_weight = standard_qty
    scale_child.driver = vehicle_doc.driver
    cell_number = frappe.get_value('Driver', vehicle_doc.driver, 'cell_number') 
    scale_child.cell_number = cell_number
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

        #for each scale_child in the doc.scale_child: if scale_item is blank, create new scale item
        #if scale_item is not blank, update scale item
        for scale_child in doc.scale_child:
            if not scale_child.scale_item == 'N':
                scale_item = frappe.get_doc('Scale Item', scale_child.scale_item, ignore_permissions=True)
                #compare the scale_item's following fields with the scale_child's fields
                update_scale_item_from_child(scale_item, scale_child)
                
            else:
                scale_item = frappe.new_doc('Scale Item')
                scale_item.company = doc.company
                scale_item.transporter = scale_child.transporter
                scale_item.driver = scale_child.driver
                scale_item.vehicle = scale_child.vehicle
                scale_item.order_note = scale_child.order_note
                scale_item.target_weight = scale_child.target_weight
                scale_item.bill_type = scale_child.bill_type
                scale_item.purchase_order = scale_child.purchase_order
                scale_item.sales_order = scale_child.sales_order
                scale_item.sales_invoice = scale_child.sales_invoice
                scale_item.type = scale_child.type
                scale_item.from_addr = scale_child.from_addr
                scale_item.to_addr = scale_child.to_addr
                scale_item.pot = scale_child.pot
                if doc.date:
                    scale_item.date = doc.date
                else:
                    scale_item.date = frappe.utils.nowdate()
                
                if doc.ship_plan:
                    #ship_plan = frappe.get_doc('Ship Plan', doc.ship_plan)
                    #scale_item.desc= ship_plan.plan_desc
                    #scale_item.item = ship_plan.item
                    scale_item.ship_plan = doc.ship_plan
                
                if doc.vehicle_plan:
                    scale_item.vehicle_plan = doc.vehicle_plan
                    
                scale_item.save(ignore_permissions=True)
                scale_child.scale_item = scale_item.name

        if doc.ship_plan:
            ship_plan_doc = frappe.get_doc('Ship Plan', doc.ship_plan, ignore_permissions=True)
        
        if doc.vehicle_plan:
            vehicle_plan_doc = frappe.get_doc('Vehicle Plan Item', doc.vehicle_plan, ignore_permissions=True)

        return {
            'status': 'success',
            'ship_plan_assigned_qty':ship_plan_doc.assigned_qty if doc.ship_plan else 0,
            'assigned_qty':vehicle_plan_doc.assigned_qty if doc.vehicle_plan else 0,
            }
    except Exception as e:
        frappe.log_error('Shipping Management Tool Save Doc',frappe.get_traceback())
        raise e


@frappe.whitelist()
def get_scale_childs(ship_plan=None, type=None, transporter=None, purchase_order=None, sales_order=None, sales_invoice=None,export=None,bill_type=None,date = None,vehicle_plan=None):
    # Initialize the base SQL query
    sql_query = """SELECT sci.name, sci.vehicle, sci.type, sci.driver, sci.cell_number, sci.target_weight, sci.status, 
    sci.from_addr, sci.to_addr, sci.sales_invoice, sci.sales_order, sci.purchase_order, sci.pot, sci.bill_type ,sci.order_note
    FROM `tabScale Item` sci
    LEFT OUTER JOIN `tabVehicle Plan Item` v_plan
    ON sci.vehicle_plan = v_plan.name
    WHERE sci.status != '9 已取消'"""

    # List to hold the parameters for the query
    values = []

    # Add conditions based on the provided filters
    if ship_plan:
        sql_query += " AND v_plan.ship_plan = %s"
        values.append(ship_plan)
    if vehicle_plan:
        sql_query += " AND sci.vehicle_plan = %s"
        values.append(vehicle_plan)
    if type:
        sql_query += " AND sci.type = %s"
        values.append(type)
    if transporter:
        sql_query += " AND sci.transporter = %s"
        values.append(transporter)
    if sales_order:
        sql_query += " AND sci.sales_order = %s"
        values.append(sales_order)
    if sales_invoice:
        sql_query += " AND sci.sales_invoice = %s"
        values.append(sales_invoice)
    if bill_type:
        sql_query += " AND sci.bill_type = %s"
        values.append(bill_type)
    if date:
        sql_query += " AND sci.date = %s"
        values.append(date)

    # Execute the SQL query
    scale_items = frappe.db.sql(sql_query, values, as_dict=1)

    # Get id of vehicle of every scale item
    for scale_item in scale_items:
        vehicle_doc = frappe.get_doc('Vehicle', scale_item['vehicle'])
        scale_item['id'] = vehicle_doc.id

    
    if export:
        from frappe.utils.xlsxutils import make_xlsx
        
        # Get the meta for the child DocType to map fieldnames to labels
        meta = frappe.get_meta('Scale Child')

        # Prepare the headers using the label of each field
        headers = []
        for fieldname in scale_items[0].keys():
            field = meta.get_field(fieldname)
            if field:
                headers.append(field.label)
            else:
                #frappe.log_error(f"Field {fieldname} not found in Meta for {child_doctype}", "Excel Export Error")
                headers.append(fieldname)  # Fallback to raw fieldname


        # Prepare the row data by taking the values of each dictionary
        rows = [list(d.values()) for d in scale_items]
        data = [headers] + rows

        xlsx_data = make_xlsx(data, 'Scale Item')
        #generate a file name + random number
        file_name = f'Scale Item_{frappe.utils.nowdate()}_{frappe.utils.nowtime()}.xlsx'
        # Save the file to the public files folder
        file_path = f'public/files/{file_name}'
        with open(frappe.get_site_path(file_path), 'wb') as file:
            file.write(xlsx_data.getvalue())

        #prepare the file URL
        file_url= f'/files/{file_name}'
        # Return the file URL to the client
        return frappe.utils.get_url(file_url)
    else:
        # Return the scale_items as a list of dictionarie
        return scale_items


def update_ship_plan(doc):

    # get the ship plan doc
    ship_plan_doc = frappe.get_doc('Ship Plan', doc.ship_plan, ignore_permissions=True)
    
    return ship_plan_doc



def update_scale_item_from_child(scale_item, scale_child):
    # List of fields to compare between scale_item and scale_child
    fields_to_compare = [
        'target_weight',
        'from_addr',
        'to_addr',
        'type',
        'driver',
        'cell_number',
        'pot',
        'sales_invoice',
        'sales_order',
        'bill_type',
        'order_note',
    ]
    
    # Track if any field value has changed
    has_changes = False
    
    # Iterate through the fields to compare
    for field in fields_to_compare:
        # Check if the field value in scale_item is different from scale_child
        if getattr(scale_item, field, None) != getattr(scale_child, field, None):
            # Update the scale_item's field value with scale_child's
            setattr(scale_item, field, getattr(scale_child, field))
            has_changes = True
            
    # If there were any changes, save the updated scale_item document
    if has_changes:
        # Use save(ignore_permissions=True) to save without permission checks
        scale_item.save(ignore_permissions=True)
        
        return True  # Return True to indicate that changes were made and saved
    else:
        return False  # Return False to indicate no changes were made


@frappe.whitelist()
def get_vehicles(transporter=None):
    if not transporter is None and not transporter == '':
        filters = {'transporter': transporter}
    else:
        filters = {}
        
    vehicle_list = frappe.get_all('Vehicle', 
                                  filters=filters, 
                                  fields=['name', 'id'],
                                  order_by='id'
                                  )
    
    #loop the vehicle list and get how many scale items are in processing
    #if the scale_item has no to_dt, then it is in processing
    for vehicle in vehicle_list:
        scale_items = frappe.get_all('Scale Item', 
                                     filters=[['vehicle', '=', vehicle['name']],["Scale Item","from_dt","is","not set"]
                                                ],
                                     fields=['name']
                                     )
        vehicle['processing'] = len(scale_items)
    return vehicle_list


@frappe.whitelist()
def save_scale_item_m(vehicle_plan ,vehicles,ship_plan_name=None, ):
    try:
        vehicle_plan_item = frappe.get_doc('Vehicle Plan Item', vehicle_plan)
        # Loop through the vehicles and create a new Scale Item for each
        data = frappe.form_dict['vehicles']  # 'vehicles' is the key for your JSON string
        vehicles = json.loads(data) 
        for vehicle in vehicles:
            scale_item = frappe.new_doc('Scale Item')
            scale_item.company = vehicle_plan_item.company
            scale_item.vehicle = vehicle['vehicle_id']
            vehicle_doc = frappe.get_doc('Vehicle', vehicle['vehicle_id'])
            if vehicle_doc.transporter:
                scale_item.transporter = vehicle_doc.transporter
            if vehicle_doc.driver:
                scale_item.driver = vehicle_doc.driver
                driver_doc = frappe.get_doc('Driver', vehicle_doc.driver)
                if driver_doc.cell_number:
                    scale_item.cell_number = driver_doc.cell_number
            
            scale_item.target_weight = vehicle['quantity']
            scale_item.type = 'OTH'
            scale_item.date = vehicle_plan_item.date
            scale_item.ship_plan = ship_plan_name
            scale_item.vehicle_plan = vehicle_plan
            scale_item.from_addr = vehicle_plan_item.from_addr
            scale_item.save(ignore_permissions=True)
        return 'success'
    except Exception as e:
        frappe.throw(frappe.get_traceback())
        raise e
    
    
@frappe.whitelist()
def cancel_scale_items(scale_items):
    #parse the json to a python object
    scale_items = frappe.parse_json(scale_items)
    results = []
    for scale_item in scale_items:
        try:
            scale_item_doc = frappe.get_doc('Scale Item', scale_item)
            scale_item_doc.cancel()
            results.append({
                'status': 'success',
                'vehicle': scale_item_doc.vehicle,
                'scale_item': scale_item_doc.name
                })
        except Exception as e:
            results.append({
                'status': 'error',
                'vehicle': scale_item_doc.vehicle,
                'scale_item': scale_item_doc.name,
                'error': e
                })
    return results

            
            
@frappe.whitelist()
def assign_warehouse_to_scale_items(scale_items, warehouse):
    #parse the json to a python object
    scale_items = frappe.parse_json(scale_items)
    results = []
    for scale_item in scale_items:
        try:
            scale_item_doc = frappe.get_doc('Scale Item', scale_item)
            scale_item_doc.pot = warehouse
            scale_item_doc.type = 'IN'
            scale_item_doc.to_addr = warehouse.split(' - ')[0]
            scale_item_doc.save(ignore_permissions=True)
            results.append({
                'status': 'success',
                'vehicle': scale_item_doc.vehicle,
                'scale_item': scale_item_doc.name
                })
        except Exception as e:
            results.append({
                'status': 'error',
                'vehicle': scale_item_doc.vehicle,
                'scale_item': scale_item_doc.name,
                'error': e
                })
    return results

@frappe.whitelist()
def assign_sales_order_to_scale_items(scale_items, plan_item, to_addr):
    #get the sales order from the plan item
    plan_item_doc = frappe.get_doc('Plan Item', plan_item)
    sales_order = plan_item_doc.sales_order
    #parse the json to a python object
    scale_items = frappe.parse_json(scale_items)
    results = []
    for scale_item in scale_items:
        try:
            scale_item_doc = frappe.get_doc('Scale Item', scale_item)
            
            scale_item_doc.sales_order = sales_order
            scale_item_doc.type = 'DIRC'
            scale_item_doc.to_addr = to_addr
            scale_item_doc.bill_type = 'SD'
            scale_item_doc.save(ignore_permissions=True)
            results.append({
                'status': 'success',
                'vehicle': scale_item_doc.vehicle,
                'scale_item': scale_item_doc.name
                })
        except Exception as e:
            results.append({
                'status': 'error',
                'vehicle': scale_item_doc.vehicle,
                'scale_item': scale_item_doc.name,
                'error': e
                })
    return results


@frappe.whitelist()
def assign_warehouse_to_ship_plan(ship_plan, warehouse, v_qty, qty,date):
    try:
        plan_item_doc = frappe.new_doc('Plan Item')
        #add a child to child table plan_items,the doctype is Ship Plan Item
        plan_item_doc.type = 'IN'
        plan_item_doc.to_addr = warehouse.split(' - ')[0]
        plan_item_doc.v_qty = v_qty
        plan_item_doc.pot = warehouse
        plan_item_doc.qty = qty
        plan_item_doc.ship_plan = ship_plan
        plan_item_doc.date = date
        plan_item_doc.save(ignore_permissions=True)
        return 'success'
    except Exception as e:
        return e

@frappe.whitelist()
def update_warehouse_to_ship_plan(ship_plan, warehouse, v_qty, item_name,qty,date):
    try:
        plan_item_doc = frappe.get_doc('Plan Item', item_name)
        
        plan_item_doc.db_update
        plan_item_doc.to_addr = warehouse.split(' - ')[0]
        plan_item_doc.v_qty = v_qty
        plan_item_doc.pot = warehouse
        plan_item_doc.qty = qty
        plan_item_doc.date = date
        plan_item_doc.save(ignore_permissions=True)
        return 'success'
    except Exception as e:
        return e
    
    
@frappe.whitelist()
def assign_sales_order_to_ship_plan(ship_plan, sales_order, to_addr, v_qty, order_note,date,qty,bill_type):
    try:
        plan_doc = frappe.new_doc('Plan Item')
        
        #add a child to child table plan_items,the doctype is Ship Plan Item
        plan_doc.date = date
        plan_doc.status = '计划中'
        plan_doc.type = 'DIRC'
        plan_doc.to_addr = to_addr
        plan_doc.v_qty = v_qty
        plan_doc.qty = qty
        plan_doc.sales_order = sales_order
        plan_doc.order_note = order_note
        plan_doc.bill_type = bill_type
        plan_doc.ship_plan = ship_plan
        plan_doc.save(ignore_permissions=True)
        return 'success'
    except Exception as e:
        return e
    
@frappe.whitelist()
def update_sales_order_to_ship_plan(ship_plan, sales_order, to_addr, v_qty, order_note, item_name, bill_type,date,qty):
    try:
        plan_item_doc = frappe.get_doc('Plan Item', item_name)
        plan_item_doc.type = 'DIRC'
        plan_item_doc.to_addr = to_addr
        plan_item_doc.v_qty = v_qty
        plan_item_doc.qty = qty
        plan_item_doc.sales_order = sales_order
        plan_item_doc.order_note = order_note
        plan_item_doc.bill_type = bill_type
        plan_item_doc.date = date
        plan_item_doc.save(ignore_permissions=True)
        return 'success'
        #get the ship plan item using item_name
    except Exception as e:
        return e

@frappe.whitelist()
def cancel_ship_plan_items(items):

    #parse the json to a python object
    items = frappe.parse_json(items)
    success_count = 0
    error_count = 0
    error_msg = []
    results = {}
    if items:
        for item in items:
            try:
                item_doc =  frappe.get_doc('Plan Item', item)
                item_doc.delete(ignore_permissions=True)
                success_count += 1
            except Exception as e:
                error_count += 1
                error_msg.append(f"删除 {item}发生错误: {e}")
        return {
            'success_count': success_count,
            'error_count': error_count,
            'error_msg': error_msg
            }
        
    
