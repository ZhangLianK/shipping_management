# Copyright (c) 2024, Alvin and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
import re

class ScaleItemCreator(Document):
	pass


@frappe.whitelist()
def create_scale_item():
	args = frappe.form_dict
	#create scale items from the args
	doc = frappe.new_doc("Scale Item")
	doc.update(args)
	doc.save()
	return doc

@frappe.whitelist()
def recoginize_vehicle_alias(text):
	text = preprocess_text(text)
	
	print(text)
	#search for plate number in the text using regex
	plate_number = extract_vehicle_numbers(text)
	driver = find_driver_info(text)
	yayun = find_yayun_info(text)
	transport_license_number = find_transport_license_number(text)
	zizhong = find_zizhong(text)
	qty = find_qty(text)
	zhoushu = extract_zhoushu(text)

	if plate_number:
		print("Plate number found")
		return {"vehicle": plate_number["vehicle"], 
		  	"guahao": plate_number["guahao"],
			"driver": driver["name"],
			"cell_number": driver["cell_number"],
			"pid": driver["pid"],
			"yayun": yayun["yayun"],
			"yayun_pid": yayun["yayun_pid"],
			"yayun_cell_number": yayun["yayun_cell_number"],
			"transport_license_number": transport_license_number["transport_license_number"],
			"zizhong": zizhong["zizhong"],
			"qty": qty["qty"],
			"zhoushu": zhoushu["zhoushu"],
			"text":text}
	else:
		print("No plate number found")
		return None
	
def extract_vehicle_numbers(text):
	"""
	从文本中提取车牌号
	:param text: 需要搜索的文本
	:return: 提取到的车牌号列表
	"""
	# 合并普通汽车和新能源车的车牌号规则
	regex = r"([京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z]{1}[A-Z]{1}[A-HJ-NP-Z0-9]{4}[A-HJ-NP-Z0-9挂学警港澳])|([京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z]{1}[A-Z]{1}[A-HJ-NP-Z0-9]{4})|([京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z]{1}[A-Z]{1}(([0-9]{5}[DF])|([DF][A-HJ-NP-Z0-9][0-9]{4})))"

	# 使用正则表达式查找所有匹配项
	matches = re.findall(regex, text)
	results = [match[0] or match[1] for match in re.findall(regex, text)]
	# 由于 findall 返回的是元组列表，我们需要从每个元组中提取匹配的车牌号
	print(matches)
	plate_number = {}
	# 检查是否有挂车车牌
	for result in results:
		if result and "挂" in result:
			plate_number["guahao"] = result
		elif len(result) == 6:
			plate_number["guahao"]= result + "挂"
		else:
			plate_number["vehicle"] = result
	return plate_number


def find_driver_info(text):
	# 正则表达式匹配规则
	# 司机关键字后可能有任意非关键信息字符，直到遇到姓名（2到4个汉字）
	# 然后跳过任意非数字字符，匹配18位身份证号和11位手机号
	pattern = r"司机.*?([\u4e00-\u9fa5]{2,4}).*?(\d+[Xx]|\d+).*?(\d+[Xx]|\d+)"
	
	# 搜索文本
	matchs = re.findall(pattern, text)
	print(matchs)
	if matchs:
		# 如果找到匹配项，返回第一个匹配项
		if len(matchs[0][1]) == 11:
			cell_number = matchs[0][1]
		elif len(matchs[0][2]) == 11:
			cell_number = matchs[0][2]
		
		if len(matchs[0][1]) == 18:
			pid = matchs[0][1]
		elif len(matchs[0][2]) == 18:
			pid = matchs[0][2]
		return {"name": matchs[0][0], "cell_number": cell_number, "pid": pid}
	else:
		# 如果没有找到匹配项，单独匹配身份证号 返回第一个符合条件的
		pattern = r"(\d{17}[Xx]|\d{18})"
		matchs = re.findall(pattern, text)
		if matchs:
			pid = matchs[0]
			#using pid to find the driver name and cell number from latest scale item with same pid
			scale_doc = frappe.get_last_doc("Scale Item", filters={"pid": pid})
			if scale_doc:
				if text.includes(scale_doc.driver):
					driver = scale_doc.driver
				else:
					driver = ""
				
				if text.includes(scale_doc.cell_number):
					cell_number = scale_doc.cell_number
				else:
					cell_number = ""
				
				return {"name": driver, "cell_number": cell_number, "pid": pid}

  
		return {"name": "", "cell_number": "", "pid": ""}
	
def find_yayun_info(text):
	# 正则表达式匹配规则
	# 押关键字后可能有任意非关键信息字符，直到遇到姓名（2到4个汉字）
	# 然后跳过任意非数字字符，匹配18位身份证号和11位手机号
	pattern = r"押.*?([\u4e00-\u9fa5]{2,4}).*?(\d+[Xx]|\d+).*?(\d+[Xx]|\d+)"
	
	# 搜索文本
	matchs = re.findall(pattern, text)
	print(matchs)
	if matchs:
		# 如果找到匹配项，返回第一个匹配项
		if len(matchs[0][1]) == 11:
			cell_number = matchs[0][1]
		elif len(matchs[0][2]) == 11:
			cell_number = matchs[0][2]
		
		if len(matchs[0][1]) == 18:
			pid = matchs[0][1]
		elif len(matchs[0][2]) == 18:
			pid = matchs[0][2]
		return {"yayun": matchs[0][0], "yayun_cell_number": cell_number, "yayun_pid": pid}
	else:
		# 如果没有找到匹配项，返回None
		return {"yayun": "", "yayun_cell_number": "", "yayun_pid": ""}

def find_transport_license_number(text):
	# 正则表达式匹配规则
	# 运输许可证号关键字后可能有任意非关键信息字符，直到遇到运输许可证号12位 211100203801
	#
	pattern = r"(?<!\d)\d{12}(?!\d)"
	
	# 搜索文本
	matchs = re.findall(pattern, text)
	print(matchs)
	if matchs.__len__() == 2:
		return {"transport_license_number": "头" + matchs[0] + "挂" + matchs[1]}
	elif matchs.__len__() == 1:
		return {"transport_license_number": "头" + matchs[0]}
	else:
		# 如果没有找到匹配项，返回None
		return {"transport_license_number": "" }
	
def find_zizhong(text):
	# 正则表达式匹配规则
	# 自重关键字后可能有任意非关键信息字符，直到遇到自重数字
	#
	pattern = r"自重.*?(\d+(?:\.\d+)?)"
	
	# 搜索文本
	matchs = re.findall(pattern, text)
	print(matchs)
	if matchs:
		# 如果找到匹配项，返回第一个匹配项
		return {"zizhong": matchs[0]}
	else:
		# 如果没有找到匹配项，返回None
		return {"zizhong": ""}
	
def find_qty(text):
	# 正则表达式匹配规则
	# 装关键字后可能有任意非关键信息字符，直到遇到吨数数字
	#
	pattern = r"装.*?(\d+(?:\.\d+)?)"
	
	# 搜索文本
	matchs = re.findall(pattern, text)
	print(matchs)
	if matchs:
		# 如果找到匹配项，返回第一个匹配项
		return {"qty": matchs[0]}
	else:
		# 如果没有找到匹配项，返回None
		return {"qty": ""}
	
def extract_zhoushu(text):
	keyword = "轴"
	# Pattern to find the nearest number after the keyword
	pattern_after = fr"{re.escape(keyword)}[^\d]*?(\d+)"
	# Pattern to find the nearest number before the keyword
	pattern_before = fr"(\d+)[^\d]*?{re.escape(keyword)}"

	# Search for the nearest number after the keyword
	match_after = re.search(pattern_after, text)
	# Search for the nearest number before the keyword
	match_before = re.search(pattern_before, text)

	# Positions of the matches relative to the keyword
	pos_after = match_after.start(1) if match_after else float('inf')
	pos_before = match_before.start(1) if match_before else float('inf')

	# Determine which number is closer and return it
	if abs(pos_after - text.find(keyword)) < abs(pos_before - text.find(keyword)):
		return {"zhoushu": match_after.group(1) if match_after else ""}
	else:
		return {"zhoushu": match_before.group(1) if match_before else ""}
	

def preprocess_text(text):
	text = text.upper()
	text = text.replace(" ", "")
	text = text.replace("姓名", "|")
	text = text.replace("电话", "|")
	text = text.replace("联系", "|")
	text = text.replace("身份证", "|")
	text = text.replace("\n", "")
	text = text.replace("：", "")
	text = text.replace(":", "")
	text = text.replace("驾驶员", "司机").replace("提货人", "司机")
	text = text.replace("号", "")  # 这里添加去除‘号’
	text = text.replace("押运员", "押")
	text = text.replace("押运", "押")
	text = text.replace("车辆", "押")
	text = text.replace("吨数", "装")
	text = text.replace("轴数", "轴")
	return text

