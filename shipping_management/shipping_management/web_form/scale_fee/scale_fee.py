import frappe

def get_context(context):
	# do your magic here
	if frappe.form_dict.scale_item:
		context.success_url = "/shipping-viewer?scale_item=" + frappe.form_dict.scale_item
		context.success_title = "非常感谢！"
		context.success_message = "提交成功！稍后会跳转到物流单页面。"
