from __future__ import unicode_literals
import frappe

def get_context(context):
    if frappe.session.user == 'Guest':
        frappe.throw('You must be logged in to view this page.', frappe.PermissionError)
    else:
        # Call the function to render your page content
        try:
            scale_item_doc = frappe.get_doc("Scale Item",frappe.form_dict.scale_item)
        except Exception as e:
            #redirect to 404 page if scale item not found
            frappe.local.flags.redirect_location = '/me'
            raise frappe.Redirect

        context.no_cache = 1

        #get driver name
        if scale_item_doc.driver:
            driver_name = frappe.get_value("Driver",scale_item_doc.driver,"full_name")
        context.scale_item = scale_item_doc.name
        context.vehicle = scale_item_doc.vehicle
        context.driver = driver_name
        try:
            scale_load_log_doc = frappe.get_last_doc("Scale Load Log",filters={"scale_item":scale_item_doc.name})
            context.load_gross_weight = scale_load_log_doc.load_gross_weight
            context.load_blank_weight = scale_load_log_doc.load_blank_weight
            context.load_net_weight = scale_load_log_doc.load_net_weight
        except Exception as e:
            context.load_gross_weight = scale_item_doc.load_gross_weight
            context.load_blank_weight = scale_item_doc.load_blank_weight
            context.load_net_weight = scale_item_doc.load_net_weight

        try:
            scale_offload_log_doc = frappe.get_last_doc("Scale Offload Log",filters={"scale_item":scale_item_doc.name})
            context.offload_gross_weight = scale_offload_log_doc.offload_gross_weight
            context.offload_blank_weight = scale_offload_log_doc.offload_blank_weight
            context.offload_net_weight = scale_offload_log_doc.offload_net_weight
        except Exception as e:
            context.offload_gross_weight = scale_item_doc.offload_gross_weight
            context.offload_blank_weight = scale_item_doc.offload_blank_weight
            context.offload_net_weight = scale_item_doc.offload_net_weight

        context.from_addr = scale_item_doc.from_addr
        context.to_addr = scale_item_doc.to_addr

        #fee
        context.tangbu = scale_item_doc.tangbu
        context.fanfee = scale_item_doc.fanfee
        context.yayunfee = scale_item_doc.yayunfee
        context.fakuan = scale_item_doc.fakuan
        context.gaosufee = scale_item_doc.gaosufee
        context.from_dt = scale_item_doc.from_dt
        context.to_dt = scale_item_doc.to_dt
        context.status = scale_item_doc.status

    
        if scale_item_doc.driver:
            driver_doc = frappe.get_doc("Driver",scale_item_doc.driver)
            context.pid = driver_doc.pid
    
        else:
            context.pid = ''
            context.cell_number = ''