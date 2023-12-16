import frappe

def get_context(context):
	# do your magic here
	if frappe.form_dict.scale_item:
		context.success_url = "/shipping-viewer?scale_item=" + frappe.form_dict.scale_item
		context.success_title = "非常感谢！"
		context.success_message = "提交成功！稍后会跳转到物流单页面。"
		
		scale_item_doc = frappe.get_doc("Scale Item",frappe.form_dict.scale_item,ignore_permissions=True)
		context.tangbu = scale_item_doc.tangbu
		context.fanfee = scale_item_doc.fanfee
		context.yayunfee = scale_item_doc.yayunfee
		context.fakuan = scale_item_doc.fakuan
		context.gaosufee = scale_item_doc.gaosufee