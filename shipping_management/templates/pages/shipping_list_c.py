from __future__ import unicode_literals
import frappe

def get_context(context):
    if frappe.session.user == 'Guest':
        frappe.throw('You must be logged in to view this page.', frappe.PermissionError)
    else:
        context.no_cache = 1
        context.title = 'Scale Items'
        context.scale_items = get_scale_items()
        
def get_scale_items():
    #get scale items from doctype Scale Item and return a list
    user_doc = frappe.get_doc('User', frappe.session.user)
    if user_doc.mobile_no:
        drivers = frappe.get_all('Driver', filters={'cell_number': user_doc.mobile_no}, fields=['name'])
        scale_items = []
        if drivers:
            for driver in drivers:
                scale_items += frappe.get_all('Scale Item', filters={'driver': driver.name, 'to_dt':["!=",""]}, fields=['name', 'status', 'date', 'vehicle', 'from_addr', 'to_addr'])

        else:
            scale_items = [{'name': '此手机号未找到司机信息', 'status': '', 'date': '', 'vehicle': '', 'from_addr': '', 'to_addr': ''}]

    else:
            scale_items = [{'name': '请在我的账户中维护手机号', 'status': '', 'date': '', 'vehicle': '', 'from_addr': '', 'to_addr': ''}]

    return scale_items
