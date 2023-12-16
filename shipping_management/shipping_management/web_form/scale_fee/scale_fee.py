import frappe

def get_context(context):
	# do your magic here
	if frappe.form_dict.scale_item:
		context.success_url = "/shipping-viewer?scale_item=" + frappe.form_dict.scale_item
		context.success_title = "非常感谢！"
		context.success_message = "提交成功！稍后会跳转到物流单页面。"
		
		scale_item_doc = frappe.get_doc("Scale Item",frappe.form_dict.scale_item,ignore_permissions=True)
		frappe.form_dict.tangbu = scale_item_doc.tangbu
		frappe.form_dict.tangbu = scale_item_doc.tangbu
		frappe.form_dict.fanfee = scale_item_doc.fanfee
		frappe.form_dict.yayunfee = scale_item_doc.yayunfee
		frappe.form_dict.fakuan = scale_item_doc.fakuan
		frappe.form_dict.gaosufee = scale_item_doc.gaosufee