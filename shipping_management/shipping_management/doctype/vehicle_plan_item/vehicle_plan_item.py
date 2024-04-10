# Copyright (c) 2024, Alvin and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils.xlsxutils import make_xlsx
from frappe.utils import cint


class VehiclePlanItem(Document):
	#update the ship plan qty when the vehicle plan item is updated or created
    def after_delete(self):
        self.update_ship_plan_qty()
        
    def on_update(self):
        self.update_ship_plan_qty()
        #get old doc
        old_doc = self.get_doc_before_save()
        #check if the ship plan has changed
        if old_doc and not old_doc.ship_plan == self.ship_plan:
            if old_doc.ship_plan:
                old_ship_plan = frappe.get_doc("Ship Plan", old_doc.ship_plan)
                old_ship_plan.update_assigned_qty()
        
    def on_save(self):
        self.update_ship_plan_qty()
            
    def update_ship_plan_qty(self):
        if self.ship_plan:
            print("Updating ship plan qty")
            ship_plan = frappe.get_doc("Ship Plan", self.ship_plan)
            ship_plan.update_assigned_qty()
        

@frappe.whitelist()
def generate_and_download_vehicle_plan_excel(vehicle_plan):
    if not vehicle_plan:
        frappe.msgprint("Vehicle Plan not specified", alert=True)
        return
    
    try:
        # Fetch scale items linked to the vehicle plan and not cancelled
        scale_items = frappe.get_all(
            "Scale Item",
            filters={"vehicle_plan": vehicle_plan, "docstatus": ["!=", 2]},  # Exclude cancelled documents
            fields=["name", "driver", "vehicle", "target_weight"],
            order_by="creation"
        )
        
        # Prepare data for Excel with headers
        headers = [
            "车号", "挂号", "道路运输许可证号", "预装量", "司机姓名", "司机手机号", "司机身份证号", "司机从业证书号",
            "自重", "轴数", "是否洗罐", "上次运载物料", "押运员",
            "押运员手机号", "押运员身份证号"
        ]
        data = [headers]
        
        # Add scale item data to the list
        for item in scale_items:
            driver_doc, vehicle_doc, yayun_doc = None, None, None
            if item.driver:
                driver_doc = frappe.get_doc("Driver", item.driver)
            if item.vehicle:
                vehicle_doc = frappe.get_doc("Vehicle", item.vehicle)
                if vehicle_doc.yayun:
                    yayun_doc = frappe.get_doc("Yayun", vehicle_doc.yayun)
            
            # Construct row data
            row = [
                vehicle_doc.license_plate if vehicle_doc else '',
                vehicle_doc.guahao if vehicle_doc else '',
                vehicle_doc.transport_license_number if vehicle_doc else '',
                item.target_weight if item.target_weight else 0,
                driver_doc.full_name if driver_doc else '',
                driver_doc.cell_number if driver_doc else '',
                driver_doc.pid if driver_doc else '',
                driver_doc.license_number if driver_doc else '',
                vehicle_doc.weight if vehicle_doc else '',
                cint(vehicle_doc.zhoushu) if vehicle_doc.zhoushu else '',
                '是' if vehicle_doc.xiguan == 1 else '否',
                vehicle_doc.prev_item if vehicle_doc.prev_item else '',
                yayun_doc.yayun_name if yayun_doc else '',
                yayun_doc.cell_number if yayun_doc else '',
                yayun_doc.pid if yayun_doc else '',
            ]
            data.append(row)
        
        # Generate Excel file
        xlsx_data = make_xlsx(data, "Vehicle Plan")
        
        # Save the file and get the URL
        file_name = f"VehiclePlan_{vehicle_plan}_Details.xlsx"
        file_url = save_xlsx_and_get_url(xlsx_data, file_name, vehicle_plan)
        
        # Provide a link for downloading the Excel file
        download_link = frappe.utils.get_url(file_url)
        return download_link
    except Exception as e:
        frappe.log_error(f"Failed to generate vehicle plan excel: {str(e)}", "Excel Generation Error")
        frappe.msgprint("Failed to generate Excel file.", alert=True)

def save_xlsx_and_get_url(xlsx_content, file_name, linked_doc_name):
    """Save the xlsx file and return its URL."""
    from frappe.utils.file_manager import save_file
    _file = save_file(file_name, xlsx_content.getvalue(), "Vehicle Plan", linked_doc_name, is_private=1)
    return _file.file_url
