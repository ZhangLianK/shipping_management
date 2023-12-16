import frappe

def get_context(context):
	# do your magic here
	if frappe.form_dict.scale_item:
		context.success_url = "/shipping-viewer?scale_item=" + frappe.form_dict.scale_item
		context.success_title = "非常感谢！"
		context.success_message = "提交成功！稍后会跳转到物流单页面。"

@frappe.whitelist()
def get_scale_item_offload(scale_item):
	result = frappe.db.get_value("Scale Item",scale_item,["offload_gross_weight","offload_net_weight","offload_blank_weight"],as_dict=1)
	return result
    