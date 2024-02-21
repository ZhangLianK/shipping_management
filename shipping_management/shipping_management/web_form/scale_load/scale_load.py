import frappe
import base64
import json
from tencentcloud.common import credential
from tencentcloud.common.profile.client_profile import ClientProfile
from tencentcloud.common.profile.http_profile import HttpProfile
from tencentcloud.common.exception.tencent_cloud_sdk_exception import TencentCloudSDKException
from tencentcloud.ocr.v20181119 import ocr_client, models
from frappe import _
import os
import re
from frappe.utils.password import get_decrypted_password


def get_context(context):
	# do your magic here
	context.show_sidebar = True
	if frappe.form_dict.scale_item:
		context.success_url = "/shipping-viewer?scale_item=" + frappe.form_dict.scale_item
		context.success_title = "非常感谢！"
		context.success_message = "提交成功！稍后会跳转到物流单页面。"
  
def get_base64(file_path):
	with open(file_path, "rb") as image_file:
		encoded_string = base64.b64encode(image_file.read())
		result = encoded_string.decode("utf-8")
		return result

def tencent_request(ImageBase64,scale_item):
	#get scale_item doc 
	scale_item_doc = frappe.get_doc('Scale Item', scale_item)
	#get secret_id and secret_key from tencent integration security doctype
	secret_info = frappe.get_all('Tencent Integration Security', filters={'company':scale_item_doc.company,'action':'OCR', 'docstatus':1}, limit_page_length=1)
	if secret_info:
		secret_info_doc = frappe.get_doc('Tencent Integration Security', secret_info[0].name)
	else:
		frappe.throw(_("No Tencent Integration Security for OCR found"))
		
	api_info = frappe.get_all('Tencent Integration Settings', filters={'company': scale_item_doc.company, 'action':'OCR', 'docstatus':1}, limit_page_length=1)
	if api_info:
		api_info_doc = frappe.get_doc('Tencent Integration Settings', api_info[0].name)
	else:
		frappe.throw(_("No Tencent Integration Setting for SMS found for the company {0}").format(scale_item_doc.company))
	
	try:
		# 实例化一个认证对象，入参需要传入腾讯云账户 SecretId 和 SecretKey，此处还需注意密钥对的保密
		# 代码泄露可能会导致 SecretId 和 SecretKey 泄露，并威胁账号下所有资源的安全性。以下代码示例仅供参考，建议采用更安全的方式来使用密钥，请参见：https://cloud.tencent.com/document/product/1278/85305
		# 密钥可前往官网控制台 https://console.cloud.tencent.com/cam/capi 进行获取
		cred = credential.Credential(secret_info_doc.secret_id, get_decrypted_password('Tencent Integration Security', secret_info_doc.name, "secret_key"))
		# 实例化一个http选项，可选的，没有特殊需求可以跳过
		httpProfile = HttpProfile()
		httpProfile.endpoint = api_info_doc.end_point

		# 实例化一个client选项，可选的，没有特殊需求可以跳过
		clientProfile = ClientProfile()
		clientProfile.httpProfile = httpProfile
		# 实例化要请求产品的client对象,clientProfile是可选的
		client = ocr_client.OcrClient(cred, api_info_doc.region, clientProfile)

		# 实例化一个请求对象,每个接口都会对应一个request对象
		req = models.RecognizeGeneralInvoiceRequest()
		params = {
			"ImageBase64": ImageBase64,
			# 将识别类型设置为其他发票
			"Types": [-1]
		}
		req.from_json_string(json.dumps(params))

		# 返回的resp是一个RecognizeGeneralInvoiceResponse的实例，与请求对象对应
		resp = client.RecognizeGeneralInvoice(req)
		# 输出json格式的字符串回包
		return (resp.to_json_string())

	except TencentCloudSDKException as err:
		frappe.publish_realtime(event=scale_item, message={'progress': 100,'total': 100},user='Guest')
		frappe.throw(_("图片识别失败，请手工填写信息"))	

		
@frappe.whitelist(allow_guest=True)
def ocr_image(load_image_upload_value,scale_item):
	#generate file full path from file name
	current_dir = os.getcwd()
	site_home = frappe.utils.get_site_name(frappe.local.request.host)
	file_path = current_dir  +"/" + site_home + load_image_upload_value
 
	frappe.publish_realtime(event=scale_item, message={'progress': 20,'total': 100},user='Guest')
 
	imageBase64 = get_base64(file_path)
	frappe.publish_realtime(event=scale_item, message={'progress': 40,'total': 100},user='Guest')
	result_str = tencent_request(imageBase64,scale_item)
 
	frappe.publish_realtime(event=scale_item, message={'progress': 60,'total': 100},user='Guest')
 
	result_json = json.loads(result_str)
	main_obj_list = result_json['MixedInvoiceItems'][0]['SingleInvoiceInfos']['OtherInvoice']['OtherInvoiceListItems']
 
	frappe.publish_realtime(event=scale_item, message={'progress': 80,'total': 100},user='Guest')
 
	print(main_obj_list)
	info = Info()
	for ent in main_obj_list:
		pattern = r"\d+\.\d+|\d+"
		match str(ent['Name']):
			case "皮重" | "空重" | "一次重量":
				info.Tare = eval(re.search(pattern, str(ent["Value"])).group())
			case "毛重" | "二次重量":
				info.ToughWeight = eval(re.search(pattern, str(ent["Value"])).group())
			case "净重" | "净重重量":
				info.NetWeight = eval(re.search(pattern, str(ent["Value"])).group())
			case "车号":
				info.VehicleNo = str(ent["Value"])
			case "皮重时间" | "空重时间" | "进车时间":
				info.TareTime = str(ent["Value"])
			case "毛重时间" | "出车时间":
				info.ToughWeightTime = str(ent["Value"])
			case "时间":
				info.TareTime = str(ent["Value"])
				info.ToughWeightTime = str(ent["Value"])
			case _:
				continue
	#return info object as json string
	frappe.publish_realtime(event=scale_item, message={'progress': 100,'total': 100},user='Guest')
	return info.__dict__


@frappe.whitelist()
def get_scale_item_load(scale_item):
	result = frappe.db.get_value("Scale Item",scale_item,["load_gross_weight","load_net_weight","load_blank_weight"],as_dict=1)
	return result
    

class Info():
	def __init__(self):
		self._Tare = None
		self._ToughWeight = None
		self._NetWeight = None
		self._VehicleNo = None
		self._ToughWeightTime = None
		self._TareTime = None

	@property
	def Tare(self):
		return self._Tare
	@Tare.setter
	def Tare(self, Tare):
		self._Tare = Tare

	@property
	def ToughWeight(self):
		return self._ToughWeight
	@ToughWeight.setter
	def ToughWeight(self, ToughWeight):
		self._ToughWeight = ToughWeight

	@property
	def NetWeight(self):
		return self._NetWeight
	@NetWeight.setter
	def NetWeight(self, NetWeight):
		self._NetWeight = NetWeight

	@property
	def VehicleNo(self):
		return self._VehicleNo
	@VehicleNo.setter
	def VehicleNo(self, VehicleNo):
		self._VehicleNo = VehicleNo

	@property
	def ToughWeightTime(self):
		return self._ToughWeightTime
	@ToughWeightTime.setter
	def ToughWeightTime(self, ToughWeightTime):
		self._ToughWeightTime = ToughWeightTime

	@property
	def TareTime(self):
		return self._TareTime
	@TareTime.setter
	def TareTime(self, TareTime):
		self._TareTime = TareTime

	def __str__(self):
		json_str = json.dumps(self.__dict__, ensure_ascii=False)
		return json_str
