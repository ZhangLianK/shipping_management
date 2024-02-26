# Copyright (c) 2023, Alvin and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

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
    ship_plan_doc=update_ship_plan(scale_item_doc)
    return {
        'status': 'success',
        'ship_plan': ship_plan_doc.as_dict()
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
                
                scale_item.target_weight = scale_child.target_weight
                scale_item.bill_type = scale_child.bill_type
                scale_item.purchase_order = scale_child.purchase_order
                scale_item.sales_order = scale_child.sales_order
                scale_item.sales_invoice = scale_child.sales_invoice
                scale_item.type = scale_child.type
                scale_item.from_addr = scale_child.from_addr
                scale_item.to_addr = scale_child.to_addr
                scale_item.pot = scale_item.pot
                if doc.date:
                    scale_item.date = doc.date
                else:
                    scale_item.date = frappe.utils.nowdate()
                
                if doc.ship_plan:
                    ship_plan = frappe.get_doc('Ship Plan', doc.ship_plan)
                    scale_item.desc= ship_plan.plan_desc
                    scale_item.item = ship_plan.item
                    scale_item.ship_plan = ship_plan.name
                    
                
                scale_item.save(ignore_permissions=True)
                scale_child.scale_item = scale_item.name

        if doc.ship_plan:
            ship_plan_doc = update_ship_plan(doc)   
            return ship_plan_doc.as_dict()
        else:
            return 'success'
    except Exception as e:
        frappe.log_error('Shipping Management Tool Save Doc',frappe.get_traceback())
        raise e


@frappe.whitelist()
def get_scale_childs(ship_plan=None, type=None, transporter=None, purchase_order=None, sales_order=None, sales_invoice=None,export=None):
    # Initialize the filters dictionary with a condition that's always true
    filters = {'status': ['!=', '9 已取消']}
    
    if ship_plan is not None and not ship_plan == '':
        filters['ship_plan'] = ship_plan
    # Conditionally add filters if parameters are provided
    if type is not None and not type == '':
        filters['type'] = type
    if transporter is not None and not transporter == '':
        filters['transporter'] = transporter
    #if purchase_order is not None:
    #    filters['purchase_order'] = purchase_order
    if sales_order is not None and not sales_order == '':
        filters['sales_order'] = sales_order
    if sales_invoice is not None and not sales_invoice == '':
        filters['sales_invoice'] = sales_invoice

    # Fetch all scale item docs according to ship_plan and any other provided filters
    scale_items = frappe.get_all('Scale Item', 
                                 filters=filters, 
                                 fields=['name', 'vehicle', 'type', 'driver', 'cell_number',
                                         'target_weight', 'status', 'from_addr', 'to_addr',
                                         'sales_invoice', 'sales_order', 'purchase_order','pot','bill_type'])

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



