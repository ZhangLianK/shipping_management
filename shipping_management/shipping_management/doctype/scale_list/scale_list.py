# Copyright (c) 2023, Alvin and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils.xlsxutils import make_xlsx
class ScaleList(Document):
	def before_save(self):
		pass
	

	def before_submit(self):
		#check if item is already in the scale list
		for item in self.items:
			#using db.sql to check if the item is already in the scale list items table
			is_exist = frappe.db.sql("""select `tabScale List Items`.name from `tabScale List Items` inner join  `tabScale List`
							on `tabScale List Items`.parent = `tabScale List`.name
							where scale_item = %s and `tabScale List`.docstatus = 1""", item.scale_item)
			if is_exist and item.repeat!= 1:
				frappe.throw("物流单 {0} 已报号，不能重复报号".format(item.scale_item))

	def on_submit(self):
		#loop for the items to check if there is any repeat item
		for item in self.items:
			if item.repeat == 1:
				#reset the scale item to not repeat
				frappe.db.set_value("Scale Item", item.scale_item, "repeat", 0)




@frappe.whitelist()
def get_scale_list_items():
	#get the args from the request
	args = frappe.form_dict
	#get all scale items from doctype scale item where purchase order is equal to purchase order
	#and docstatus is 1 and not in any scale list's item
	#return the list of scale items
	scale_list_items = frappe.db.sql("""select a.name, 
		a.item, 
		a.vehicle,
		a.repeat,
		a.target_weight as qty,
		m.driver,
		m.driver_id,
		m.phone,
		m.license_number,
		m.yayun,
		m.yayun_cell_number,
		m.yayun_pid,
		m.guahao,
		m.transport_license_number,
		m.zhoushu
	from `tabScale Item`  a
		left outer join (
				select v.name as vehicle,
		d.full_name as driver,
		d.pid as driver_id,
		d.cell_number as phone,
		d.license_number as license_number,
		e.yayun_name as yayun,
		e.cell_number as yayun_cell_number,
		e.pid as yayun_pid,
		v.guahao as guahao,
		v.transport_license_number as transport_license_number,
		v.zhoushu  as zhoushu
							  
							   from `tabVehicle` v
					left outer join `tabDriver` d on v.driver = d.name
					left outer join `tabYayun` e on v.yayun = e.name
		) m
		on m.vehicle = a.vehicle
	   where a.ship_plan = %s 
		and a.date = %s
	   and a.docstatus = 1 
	   and (a.name not in 
			(select scale_item from `tabScale List Items`
				inner join `tabScale List` on `tabScale List Items`.parent = `tabScale List`.name
							  where `tabScale List`.docstatus = 1
				)
				or a.repeat = 1)""", (args.ship_plan, args.date), as_dict=1)
	
	#loop the scale_list_items and add the vehicle info and driver info and yayun info



	

	return scale_list_items

@frappe.whitelist()
def generate_and_download():
	#get the args from the request
	args = frappe.form_dict
	if not args.scale_list:
		frappe.msgprint("无报号单", alert=True)
		return
	try:
	# Fetch scale items linked to the vehicle plan and not cancelled
		scale_list_doc = frappe.get_doc("Scale List", args.scale_list)

		# Prepare data for Excel with headers
		headers = [
			"单号","车号", "挂号", "司机" , "身份证", "手机", "预装量", "道路运输许可证",
			"从业资格证号", "轴数", "押运员", "押运身份证", "押运员电话"
		]
		data = [headers]

		# Add scale item data to the list	
		for item in scale_list_doc.items:
			# Construct row data
			row = [
				item.scale_item,
				item.vehicle,
				item.guahao,
				item.driver,
				item.driver_id,
				item.phone,
				item.qty,
				item.transport_license_number,
				item.license_number,
				item.zhoushu,
				item.yayun,
				item.yayun_pid,
				item.yayun_cell_phone
			]
			data.append(row)

		# Generate Excel file
		xlsx_data = make_xlsx(data, "Vehicle Plan")

		# Save the file and get the URL
		file_name = f"报号单{scale_list_doc.name}_{scale_list_doc.ship_plan_desc}.xlsx"
		file_url = save_xlsx_and_get_url(xlsx_data, file_name, scale_list_doc.name)

		# Provide a link for downloading the Excel file
		download_link = frappe.utils.get_url(file_url)
		return download_link
	except Exception as e:
		frappe.log_error(f"Failed to generate vehicle plan excel: {str(e)}", "Excel Generation Error")
		frappe.msgprint("Failed to generate Excel file.", alert=True)



def save_xlsx_and_get_url(xlsx_content, file_name, linked_doc_name):
	"""Save the xlsx file and return its URL."""
	from frappe.utils.file_manager import save_file
	_file = save_file(file_name, xlsx_content.getvalue(), "Scale List", linked_doc_name, is_private=1)
	return _file.file_url
