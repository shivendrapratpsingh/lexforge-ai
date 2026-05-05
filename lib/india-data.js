// ─────────────────────────────────────────────────────────────────
//  LexForge AI — india-data.js
//  Single source of truth for: all Indian states, every district,
//  all 25 High Courts (with permanent / circuit benches), and all
//  central tribunals. Court entries used elsewhere (lib/utils.js,
//  forms, AI prompts) are derived from this file at import time so
//  there is exactly one place to update if a district is added or
//  a bench is created.
// ─────────────────────────────────────────────────────────────────

// ─── States & UTs with their districts ────────────────────────────
// Source: official state govt district pages and Wikipedia (validated
// against the August 2025 reorganisations in Rajasthan, Telangana
// and J&K). Districts are listed in their commonly used English
// transliteration. Ordering is administrative, not alphabetical.
export const STATES = [
  { code: 'AP', name: 'Andhra Pradesh', hcValue: 'ANDHRA_HC', districts: [
    'Anantapur','Chittoor','East Godavari','Guntur','Krishna','Kurnool','Nellore','Prakasam','Srikakulam','Visakhapatnam','Vizianagaram','West Godavari','YSR Kadapa',
    'Alluri Sitharama Raju','Anakapalli','Annamayya','Bapatla','Eluru','Kakinada','Konaseema','Manyam','NTR','Palnadu','Sri Sathya Sai','Tirupati'
  ] },
  { code: 'AR', name: 'Arunachal Pradesh', hcValue: 'GAUHATI_HC_ITANAGAR', districts: [
    'Anjaw','Changlang','Dibang Valley','East Kameng','East Siang','Kamle','Kra Daadi','Kurung Kumey','Lepa Rada','Lohit','Longding','Lower Dibang Valley','Lower Siang','Lower Subansiri','Namsai','Pakke-Kessang','Papum Pare','Shi-Yomi','Siang','Tawang','Tirap','Upper Siang','Upper Subansiri','West Kameng','West Siang'
  ] },
  { code: 'AS', name: 'Assam', hcValue: 'GAUHATI_HC', districts: [
    'Baksa','Barpeta','Biswanath','Bongaigaon','Cachar','Charaideo','Chirang','Darrang','Dhemaji','Dhubri','Dibrugarh','Dima Hasao','Goalpara','Golaghat','Hailakandi','Hojai','Jorhat','Kamrup','Kamrup Metropolitan','Karbi Anglong','Karimganj','Kokrajhar','Lakhimpur','Majuli','Morigaon','Nagaon','Nalbari','Sivasagar','Sonitpur','South Salmara-Mankachar','Tinsukia','Udalguri','West Karbi Anglong','Bajali','Tamulpur'
  ] },
  { code: 'BR', name: 'Bihar', hcValue: 'PATNA_HC', districts: [
    'Araria','Arwal','Aurangabad','Banka','Begusarai','Bhagalpur','Bhojpur','Buxar','Darbhanga','East Champaran (Motihari)','Gaya','Gopalganj','Jamui','Jehanabad','Kaimur (Bhabua)','Katihar','Khagaria','Kishanganj','Lakhisarai','Madhepura','Madhubani','Munger','Muzaffarpur','Nalanda','Nawada','Patna','Purnia','Rohtas','Saharsa','Samastipur','Saran','Sheikhpura','Sheohar','Sitamarhi','Siwan','Supaul','Vaishali','West Champaran (Bettiah)'
  ] },
  { code: 'CG', name: 'Chhattisgarh', hcValue: 'CHHATTISGARH_HC', districts: [
    'Balod','Baloda Bazar','Balrampur','Bastar','Bemetara','Bijapur','Bilaspur','Dantewada','Dhamtari','Durg','Gariaband','Gaurela-Pendra-Marwahi','Janjgir-Champa','Jashpur','Kabirdham (Kawardha)','Kanker','Kondagaon','Korba','Koriya','Mahasamund','Manendragarh-Chirmiri-Bharatpur','Mohla-Manpur-Ambagarh Chouki','Mungeli','Narayanpur','Raigarh','Raipur','Rajnandgaon','Sakti','Sarangarh-Bilaigarh','Sukma','Surajpur','Surguja','Khairagarh-Chhuikhadan-Gandai'
  ] },
  { code: 'GA', name: 'Goa', hcValue: 'BOMBAY_HC_GOA', districts: ['North Goa','South Goa'] },
  { code: 'GJ', name: 'Gujarat', hcValue: 'GUJARAT_HC', districts: [
    'Ahmedabad','Amreli','Anand','Aravalli','Banaskantha','Bharuch','Bhavnagar','Botad','Chhota Udaipur','Dahod','Dang','Devbhoomi Dwarka','Gandhinagar','Gir Somnath','Jamnagar','Junagadh','Kheda','Kutch','Mahisagar','Mehsana','Morbi','Narmada','Navsari','Panchmahal','Patan','Porbandar','Rajkot','Sabarkantha','Surat','Surendranagar','Tapi','Vadodara','Valsad'
  ] },
  { code: 'HR', name: 'Haryana', hcValue: 'PUNJAB_HARYANA_HC', districts: [
    'Ambala','Bhiwani','Charkhi Dadri','Faridabad','Fatehabad','Gurugram','Hisar','Jhajjar','Jind','Kaithal','Karnal','Kurukshetra','Mahendragarh','Nuh','Palwal','Panchkula','Panipat','Rewari','Rohtak','Sirsa','Sonipat','Yamunanagar'
  ] },
  { code: 'HP', name: 'Himachal Pradesh', hcValue: 'HP_HC', districts: [
    'Bilaspur','Chamba','Hamirpur','Kangra','Kinnaur','Kullu','Lahaul and Spiti','Mandi','Shimla','Sirmaur','Solan','Una'
  ] },
  { code: 'JH', name: 'Jharkhand', hcValue: 'JHARKHAND_HC', districts: [
    'Bokaro','Chatra','Deoghar','Dhanbad','Dumka','East Singhbhum','Garhwa','Giridih','Godda','Gumla','Hazaribagh','Jamtara','Khunti','Koderma','Latehar','Lohardaga','Pakur','Palamu','Ramgarh','Ranchi','Sahebganj','Seraikela-Kharsawan','Simdega','West Singhbhum'
  ] },
  { code: 'KA', name: 'Karnataka', hcValue: 'KARNATAKA_HC', districts: [
    'Bagalkot','Ballari','Belagavi','Bengaluru Rural','Bengaluru Urban','Bidar','Chamarajanagar','Chikballapur','Chikkamagaluru','Chitradurga','Dakshina Kannada','Davanagere','Dharwad','Gadag','Hassan','Haveri','Kalaburagi','Kodagu','Kolar','Koppal','Mandya','Mysuru','Raichur','Ramanagara','Shivamogga','Tumakuru','Udupi','Uttara Kannada','Vijayanagara','Vijayapura','Yadgir'
  ] },
  { code: 'KL', name: 'Kerala', hcValue: 'KERALA_HC', districts: [
    'Alappuzha','Ernakulam','Idukki','Kannur','Kasaragod','Kollam','Kottayam','Kozhikode','Malappuram','Palakkad','Pathanamthitta','Thiruvananthapuram','Thrissur','Wayanad'
  ] },
  { code: 'MP', name: 'Madhya Pradesh', hcValue: 'MP_HC', districts: [
    'Agar Malwa','Alirajpur','Anuppur','Ashoknagar','Balaghat','Barwani','Betul','Bhind','Bhopal','Burhanpur','Chhatarpur','Chhindwara','Damoh','Datia','Dewas','Dhar','Dindori','Guna','Gwalior','Harda','Hoshangabad (Narmadapuram)','Indore','Jabalpur','Jhabua','Katni','Khandwa','Khargone','Maihar','Mandla','Mandsaur','Morena','Narsinghpur','Neemuch','Niwari','Pandhurna','Panna','Raisen','Rajgarh','Ratlam','Rewa','Sagar','Satna','Sehore','Seoni','Shahdol','Shajapur','Sheopur','Shivpuri','Sidhi','Singrauli','Tikamgarh','Ujjain','Umaria','Vidisha'
  ] },
  { code: 'MH', name: 'Maharashtra', hcValue: 'BOMBAY_HC', districts: [
    'Ahmednagar','Akola','Amravati','Aurangabad (Chhatrapati Sambhajinagar)','Beed','Bhandara','Buldhana','Chandrapur','Dhule','Gadchiroli','Gondia','Hingoli','Jalgaon','Jalna','Kolhapur','Latur','Mumbai City','Mumbai Suburban','Nagpur','Nanded','Nandurbar','Nashik','Osmanabad (Dharashiv)','Palghar','Parbhani','Pune','Raigad','Ratnagiri','Sangli','Satara','Sindhudurg','Solapur','Thane','Wardha','Washim','Yavatmal'
  ] },
  { code: 'MN', name: 'Manipur', hcValue: 'MANIPUR_HC', districts: [
    'Bishnupur','Chandel','Churachandpur','Imphal East','Imphal West','Jiribam','Kakching','Kamjong','Kangpokpi','Noney','Pherzawl','Senapati','Tamenglong','Tengnoupal','Thoubal','Ukhrul'
  ] },
  { code: 'ML', name: 'Meghalaya', hcValue: 'MEGHALAYA_HC', districts: [
    'East Garo Hills','East Jaintia Hills','East Khasi Hills','Eastern West Khasi Hills','North Garo Hills','Ri Bhoi','South Garo Hills','South West Garo Hills','South West Khasi Hills','West Garo Hills','West Jaintia Hills','West Khasi Hills'
  ] },
  { code: 'MZ', name: 'Mizoram', hcValue: 'GAUHATI_HC_AIZAWL', districts: [
    'Aizawl','Champhai','Hnahthial','Khawzawl','Kolasib','Lawngtlai','Lunglei','Mamit','Saiha','Saitual','Serchhip'
  ] },
  { code: 'NL', name: 'Nagaland', hcValue: 'GAUHATI_HC_KOHIMA', districts: [
    'Chumukedima','Dimapur','Kiphire','Kohima','Longleng','Mokokchung','Mon','Niuland','Noklak','Peren','Phek','Shamator','Tseminyu','Tuensang','Wokha','Zunheboto'
  ] },
  { code: 'OD', name: 'Odisha', hcValue: 'ORISSA_HC', districts: [
    'Angul','Balangir','Balasore','Bargarh','Bhadrak','Boudh','Cuttack','Deogarh','Dhenkanal','Gajapati','Ganjam','Jagatsinghpur','Jajpur','Jharsuguda','Kalahandi','Kandhamal','Kendrapara','Kendujhar (Keonjhar)','Khordha','Koraput','Malkangiri','Mayurbhanj','Nabarangpur','Nayagarh','Nuapada','Puri','Rayagada','Sambalpur','Subarnapur (Sonepur)','Sundargarh'
  ] },
  { code: 'PB', name: 'Punjab', hcValue: 'PUNJAB_HARYANA_HC', districts: [
    'Amritsar','Barnala','Bathinda','Faridkot','Fatehgarh Sahib','Fazilka','Ferozepur','Gurdaspur','Hoshiarpur','Jalandhar','Kapurthala','Ludhiana','Malerkotla','Mansa','Moga','Pathankot','Patiala','Rupnagar','S.A.S. Nagar (Mohali)','Sangrur','S.B.S. Nagar (Nawanshahr)','Sri Muktsar Sahib','Tarn Taran'
  ] },
  { code: 'RJ', name: 'Rajasthan', hcValue: 'RAJASTHAN_HC', districts: [
    'Ajmer','Alwar','Banswara','Baran','Barmer','Bharatpur','Bhilwara','Bikaner','Bundi','Chittorgarh','Churu','Dausa','Dholpur','Dungarpur','Hanumangarh','Jaipur','Jaisalmer','Jalore','Jhalawar','Jhunjhunu','Jodhpur','Karauli','Kota','Nagaur','Pali','Pratapgarh','Rajsamand','Sawai Madhopur','Sikar','Sirohi','Sri Ganganagar','Tonk','Udaipur'
  ] },
  { code: 'SK', name: 'Sikkim', hcValue: 'SIKKIM_HC', districts: [
    'Gangtok','Geyzing (West Sikkim)','Gyalshing','Mangan (North Sikkim)','Namchi (South Sikkim)','Pakyong','Soreng'
  ] },
  { code: 'TN', name: 'Tamil Nadu', hcValue: 'MADRAS_HC_FULL', districts: [
    'Ariyalur','Chengalpattu','Chennai','Coimbatore','Cuddalore','Dharmapuri','Dindigul','Erode','Kallakurichi','Kanchipuram','Kanyakumari','Karur','Krishnagiri','Madurai','Mayiladuthurai','Nagapattinam','Namakkal','Nilgiris','Perambalur','Pudukkottai','Ramanathapuram','Ranipet','Salem','Sivaganga','Tenkasi','Thanjavur','Theni','Thoothukudi (Tuticorin)','Tiruchirappalli','Tirunelveli','Tirupathur','Tiruppur','Tiruvallur','Tiruvannamalai','Tiruvarur','Vellore','Viluppuram','Virudhunagar'
  ] },
  { code: 'TG', name: 'Telangana', hcValue: 'TELANGANA_HC', districts: [
    'Adilabad','Bhadradri Kothagudem','Hanumakonda','Hyderabad','Jagtial','Jangaon','Jayashankar Bhupalpally','Jogulamba Gadwal','Kamareddy','Karimnagar','Khammam','Kumuram Bheem Asifabad','Mahabubabad','Mahbubnagar','Mancherial','Medak','Medchal-Malkajgiri','Mulugu','Nagarkurnool','Nalgonda','Narayanpet','Nirmal','Nizamabad','Peddapalli','Rajanna Sircilla','Rangareddy','Sangareddy','Siddipet','Suryapet','Vikarabad','Wanaparthy','Warangal','Yadadri Bhuvanagiri'
  ] },
  { code: 'TR', name: 'Tripura', hcValue: 'TRIPURA_HC', districts: [
    'Dhalai','Gomati','Khowai','North Tripura','Sepahijala','South Tripura','Unakoti','West Tripura'
  ] },
  { code: 'UP', name: 'Uttar Pradesh', hcValue: 'PRAYAGRAJ_HC', districts: [
    'Agra','Aligarh','Ambedkar Nagar','Amethi','Amroha','Auraiya','Ayodhya (Faizabad)','Azamgarh','Baghpat','Bahraich','Ballia','Balrampur','Banda','Barabanki','Bareilly','Basti','Bhadohi','Bijnor','Budaun','Bulandshahr','Chandauli','Chitrakoot','Deoria','Etah','Etawah','Farrukhabad','Fatehpur','Firozabad','Gautam Buddha Nagar','Ghaziabad','Ghazipur','Gonda','Gorakhpur','Hamirpur','Hapur','Hardoi','Hathras','Jalaun','Jaunpur','Jhansi','Kannauj','Kanpur Dehat','Kanpur Nagar','Kasganj','Kaushambi','Kheri (Lakhimpur)','Kushinagar','Lalitpur','Lucknow','Maharajganj','Mahoba','Mainpuri','Mathura','Mau','Meerut','Mirzapur','Moradabad','Muzaffarnagar','Pilibhit','Pratapgarh','Prayagraj (Allahabad)','Raebareli','Rampur','Saharanpur','Sambhal','Sant Kabir Nagar','Shahjahanpur','Shamli','Shravasti','Siddharthnagar','Sitapur','Sonbhadra','Sultanpur','Unnao','Varanasi'
  ] },
  { code: 'UK', name: 'Uttarakhand', hcValue: 'UTTARAKHAND_HC', districts: [
    'Almora','Bageshwar','Chamoli','Champawat','Dehradun','Haridwar','Nainital','Pauri Garhwal','Pithoragarh','Rudraprayag','Tehri Garhwal','Udham Singh Nagar','Uttarkashi'
  ] },
  { code: 'WB', name: 'West Bengal', hcValue: 'CALCUTTA_HC', districts: [
    'Alipurduar','Bankura','Birbhum','Cooch Behar','Dakshin Dinajpur','Darjeeling','Hooghly','Howrah','Jalpaiguri','Jhargram','Kalimpong','Kolkata','Malda','Murshidabad','Nadia','North 24 Parganas','Paschim Bardhaman','Paschim Medinipur','Purba Bardhaman','Purba Medinipur','Purulia','South 24 Parganas','Uttar Dinajpur'
  ] },
  // ── Union Territories ────────────────────────────────────────
  { code: 'AN', name: 'Andaman & Nicobar Islands', hcValue: 'CALCUTTA_HC_PORTBLAIR', districts: ['Nicobar','North & Middle Andaman','South Andaman'] },
  { code: 'CH', name: 'Chandigarh', hcValue: 'PUNJAB_HARYANA_HC', districts: ['Chandigarh'] },
  { code: 'DN', name: 'Dadra & Nagar Haveli and Daman & Diu', hcValue: 'BOMBAY_HC', districts: ['Dadra and Nagar Haveli','Daman','Diu'] },
  { code: 'DL', name: 'Delhi', hcValue: 'DELHI_HC', districts: [
    'Central Delhi','East Delhi','New Delhi','North Delhi','North East Delhi','North West Delhi','Shahdara','South Delhi','South East Delhi','South West Delhi','West Delhi'
  ] },
  { code: 'JK', name: 'Jammu & Kashmir', hcValue: 'JK_HC', districts: [
    'Anantnag','Bandipora','Baramulla','Budgam','Doda','Ganderbal','Jammu','Kathua','Kishtwar','Kulgam','Kupwara','Poonch','Pulwama','Rajouri','Ramban','Reasi','Samba','Shopian','Srinagar','Udhampur'
  ] },
  { code: 'LA', name: 'Ladakh', hcValue: 'JK_HC', districts: ['Kargil','Leh'] },
  { code: 'LD', name: 'Lakshadweep', hcValue: 'KERALA_HC', districts: ['Lakshadweep'] },
  { code: 'PY', name: 'Puducherry', hcValue: 'MADRAS_HC_FULL', districts: ['Karaikal','Mahe','Puducherry','Yanam'] },
]

// ─── National (Union) Tribunals ───────────────────────────────────
// These are the tribunals/commissions of all-India jurisdiction.
// Many have benches; we list the principal seat plus key benches.
export const NATIONAL_TRIBUNALS = [
  { value: 'SUPREME_COURT', label: 'Supreme Court of India',                                               short: 'Supreme Court of India',           state: 'Union' },
  { value: 'NCLT_DELHI',    label: 'National Company Law Tribunal — Principal Bench (Delhi)',             short: 'NCLT — New Delhi',                 state: 'Union' },
  { value: 'NCLT_MUMBAI',   label: 'NCLT — Mumbai Bench',                                                  short: 'NCLT — Mumbai',                    state: 'Maharashtra' },
  { value: 'NCLT_KOLKATA',  label: 'NCLT — Kolkata Bench',                                                 short: 'NCLT — Kolkata',                   state: 'West Bengal' },
  { value: 'NCLT_CHENNAI',  label: 'NCLT — Chennai Bench',                                                 short: 'NCLT — Chennai',                   state: 'Tamil Nadu' },
  { value: 'NCLT_AHMEDABAD', label: 'NCLT — Ahmedabad Bench',                                              short: 'NCLT — Ahmedabad',                 state: 'Gujarat' },
  { value: 'NCLT_BENGALURU', label: 'NCLT — Bengaluru Bench',                                              short: 'NCLT — Bengaluru',                 state: 'Karnataka' },
  { value: 'NCLT_HYDERABAD', label: 'NCLT — Hyderabad Bench',                                              short: 'NCLT — Hyderabad',                 state: 'Telangana' },
  { value: 'NCLT_ALLAHABAD', label: 'NCLT — Allahabad Bench',                                              short: 'NCLT — Allahabad',                 state: 'Uttar Pradesh' },
  { value: 'NCLAT',         label: 'National Company Law Appellate Tribunal (NCLAT) — Delhi',              short: 'NCLAT',                            state: 'Union' },
  { value: 'NCLAT_CHENNAI', label: 'NCLAT — Chennai Bench',                                                short: 'NCLAT — Chennai',                  state: 'Tamil Nadu' },
  { value: 'ITAT_DELHI',    label: 'Income Tax Appellate Tribunal — Delhi (Principal)',                    short: 'ITAT — Delhi',                     state: 'Union' },
  { value: 'ITAT_MUMBAI',   label: 'ITAT — Mumbai Bench',                                                  short: 'ITAT — Mumbai',                    state: 'Maharashtra' },
  { value: 'ITAT_KOLKATA',  label: 'ITAT — Kolkata Bench',                                                 short: 'ITAT — Kolkata',                   state: 'West Bengal' },
  { value: 'ITAT_CHENNAI',  label: 'ITAT — Chennai Bench',                                                 short: 'ITAT — Chennai',                   state: 'Tamil Nadu' },
  { value: 'ITAT_BENGALURU', label: 'ITAT — Bengaluru Bench',                                              short: 'ITAT — Bengaluru',                 state: 'Karnataka' },
  { value: 'ITAT_HYDERABAD', label: 'ITAT — Hyderabad Bench',                                              short: 'ITAT — Hyderabad',                 state: 'Telangana' },
  { value: 'ITAT_AHMEDABAD', label: 'ITAT — Ahmedabad Bench',                                              short: 'ITAT — Ahmedabad',                 state: 'Gujarat' },
  { value: 'ITAT_LUCKNOW',  label: 'ITAT — Lucknow Bench',                                                 short: 'ITAT — Lucknow',                   state: 'Uttar Pradesh' },
  { value: 'GSTAT',         label: 'GST Appellate Tribunal — Principal Bench (Delhi)',                     short: 'GSTAT — Delhi',                    state: 'Union' },
  { value: 'AFT_DELHI',     label: 'Armed Forces Tribunal — Principal Bench (Delhi)',                      short: 'AFT — Delhi',                      state: 'Union' },
  { value: 'AFT_LUCKNOW',   label: 'AFT — Lucknow Bench',                                                  short: 'AFT — Lucknow',                    state: 'Uttar Pradesh' },
  { value: 'AFT_KOLKATA',   label: 'AFT — Kolkata Bench',                                                  short: 'AFT — Kolkata',                    state: 'West Bengal' },
  { value: 'AFT_CHANDIGARH', label: 'AFT — Chandigarh Bench',                                              short: 'AFT — Chandigarh',                 state: 'Chandigarh' },
  { value: 'AFT_KOCHI',     label: 'AFT — Kochi Bench',                                                    short: 'AFT — Kochi',                      state: 'Kerala' },
  { value: 'AFT_MUMBAI',    label: 'AFT — Mumbai Bench',                                                   short: 'AFT — Mumbai',                     state: 'Maharashtra' },
  { value: 'NGT_DELHI',     label: 'National Green Tribunal — Principal Bench (Delhi)',                    short: 'NGT — Delhi',                      state: 'Union' },
  { value: 'NGT_BHOPAL',    label: 'NGT — Bhopal (Central) Zonal Bench',                                   short: 'NGT — Bhopal',                     state: 'Madhya Pradesh' },
  { value: 'NGT_PUNE',      label: 'NGT — Pune (Western) Zonal Bench',                                     short: 'NGT — Pune',                       state: 'Maharashtra' },
  { value: 'NGT_KOLKATA',   label: 'NGT — Kolkata (Eastern) Zonal Bench',                                  short: 'NGT — Kolkata',                    state: 'West Bengal' },
  { value: 'NGT_CHENNAI',   label: 'NGT — Chennai (Southern) Zonal Bench',                                 short: 'NGT — Chennai',                    state: 'Tamil Nadu' },
  { value: 'CAT_PRINCIPAL', label: 'Central Administrative Tribunal — Principal Bench (Delhi)',            short: 'CAT — Delhi',                      state: 'Union' },
  { value: 'CAT_MUMBAI',    label: 'CAT — Mumbai Bench',                                                   short: 'CAT — Mumbai',                     state: 'Maharashtra' },
  { value: 'CAT_KOLKATA',   label: 'CAT — Kolkata Bench',                                                  short: 'CAT — Kolkata',                    state: 'West Bengal' },
  { value: 'CAT_CHENNAI',   label: 'CAT — Chennai Bench',                                                  short: 'CAT — Chennai',                    state: 'Tamil Nadu' },
  { value: 'CAT_BENGALURU', label: 'CAT — Bengaluru Bench',                                                short: 'CAT — Bengaluru',                  state: 'Karnataka' },
  { value: 'CAT_HYDERABAD', label: 'CAT — Hyderabad Bench',                                                short: 'CAT — Hyderabad',                  state: 'Telangana' },
  { value: 'CAT_ALLAHABAD', label: 'CAT — Allahabad Bench',                                                short: 'CAT — Allahabad',                  state: 'Uttar Pradesh' },
  { value: 'CAT_LUCKNOW',   label: 'CAT — Lucknow Bench',                                                  short: 'CAT — Lucknow',                    state: 'Uttar Pradesh' },
  { value: 'CAT_AHMEDABAD', label: 'CAT — Ahmedabad Bench',                                                short: 'CAT — Ahmedabad',                  state: 'Gujarat' },
  { value: 'CAT_CHANDIGARH', label: 'CAT — Chandigarh Bench',                                              short: 'CAT — Chandigarh',                 state: 'Chandigarh' },
  { value: 'CAT_GUWAHATI',  label: 'CAT — Guwahati Bench',                                                 short: 'CAT — Guwahati',                   state: 'Assam' },
  { value: 'CAT_JABALPUR',  label: 'CAT — Jabalpur Bench',                                                 short: 'CAT — Jabalpur',                   state: 'Madhya Pradesh' },
  { value: 'CAT_JAIPUR',    label: 'CAT — Jaipur Bench',                                                   short: 'CAT — Jaipur',                     state: 'Rajasthan' },
  { value: 'CAT_JODHPUR',   label: 'CAT — Jodhpur Bench',                                                  short: 'CAT — Jodhpur',                    state: 'Rajasthan' },
  { value: 'CAT_PATNA',     label: 'CAT — Patna Bench',                                                    short: 'CAT — Patna',                      state: 'Bihar' },
  { value: 'CAT_CUTTACK',   label: 'CAT — Cuttack Bench',                                                  short: 'CAT — Cuttack',                    state: 'Odisha' },
  { value: 'CAT_ERNAKULAM', label: 'CAT — Ernakulam Bench',                                                short: 'CAT — Ernakulam',                  state: 'Kerala' },
  { value: 'CAT_JAMMU',     label: 'CAT — Jammu Bench',                                                    short: 'CAT — Jammu',                      state: 'J&K' },
  { value: 'DRT_DELHI',     label: 'Debts Recovery Tribunal — Delhi-I',                                    short: 'DRT — Delhi',                      state: 'Union' },
  { value: 'DRT_MUMBAI',    label: 'DRT — Mumbai',                                                         short: 'DRT — Mumbai',                     state: 'Maharashtra' },
  { value: 'DRT_KOLKATA',   label: 'DRT — Kolkata',                                                        short: 'DRT — Kolkata',                    state: 'West Bengal' },
  { value: 'DRT_CHENNAI',   label: 'DRT — Chennai',                                                        short: 'DRT — Chennai',                    state: 'Tamil Nadu' },
  { value: 'DRT_BENGALURU', label: 'DRT — Bengaluru',                                                      short: 'DRT — Bengaluru',                  state: 'Karnataka' },
  { value: 'DRT_HYDERABAD', label: 'DRT — Hyderabad',                                                      short: 'DRT — Hyderabad',                  state: 'Telangana' },
  { value: 'DRT_ALLAHABAD', label: 'DRT — Allahabad',                                                      short: 'DRT — Allahabad',                  state: 'Uttar Pradesh' },
  { value: 'DRT_LUCKNOW',   label: 'DRT — Lucknow',                                                        short: 'DRT — Lucknow',                    state: 'Uttar Pradesh' },
  { value: 'DRAT_DELHI',    label: 'Debts Recovery Appellate Tribunal — Delhi',                            short: 'DRAT — Delhi',                     state: 'Union' },
  { value: 'SAT',           label: 'Securities Appellate Tribunal (SAT) — Mumbai',                         short: 'SAT — Mumbai',                     state: 'Maharashtra' },
  { value: 'CCI',           label: 'Competition Commission of India (CCI) — Delhi',                        short: 'CCI — Delhi',                      state: 'Union' },
  { value: 'NCDRC',         label: 'National Consumer Disputes Redressal Commission — Delhi',              short: 'NCDRC',                            state: 'Union' },
  { value: 'TDSAT',         label: 'Telecom Disputes Settlement and Appellate Tribunal (TDSAT) — Delhi',   short: 'TDSAT',                            state: 'Union' },
  { value: 'IBBI',          label: 'Insolvency and Bankruptcy Board of India (IBBI) — Delhi',              short: 'IBBI',                             state: 'Union' },
  { value: 'CESTAT',        label: 'Customs, Excise and Service Tax Appellate Tribunal (CESTAT) — Delhi',  short: 'CESTAT',                           state: 'Union' },
  { value: 'NHRC',          label: 'National Human Rights Commission (NHRC) — Delhi',                      short: 'NHRC',                             state: 'Union' },
  { value: 'NCW',           label: 'National Commission for Women (NCW) — Delhi',                          short: 'NCW',                              state: 'Union' },
  { value: 'NCPCR',         label: 'National Commission for Protection of Child Rights (NCPCR) — Delhi',   short: 'NCPCR',                            state: 'Union' },
  { value: 'CIC',           label: 'Central Information Commission (CIC) — Delhi',                         short: 'CIC',                              state: 'Union' },
]

// ─── All 25 High Courts (with permanent and circuit benches) ─────
// Master list. For each HC entry, `state` is the primary state served.
export const ALL_HIGH_COURTS = [
  { value: 'BOMBAY_HC',              label: 'High Court of Judicature at Bombay (Mumbai)',                  short: 'Bombay HC – Mumbai',          state: 'Maharashtra' },
  { value: 'BOMBAY_HC_AURANGABAD',   label: 'Bombay HC, Aurangabad Bench',                                  short: 'Bombay HC – Aurangabad',      state: 'Maharashtra' },
  { value: 'BOMBAY_HC_NAGPUR',       label: 'Bombay HC, Nagpur Bench',                                      short: 'Bombay HC – Nagpur',          state: 'Maharashtra' },
  { value: 'BOMBAY_HC_GOA',          label: 'Bombay HC, Panaji (Goa) Bench',                                short: 'Bombay HC – Goa',             state: 'Goa' },
  { value: 'CALCUTTA_HC',            label: 'High Court of Calcutta (Kolkata)',                             short: 'Calcutta HC',                 state: 'West Bengal' },
  { value: 'CALCUTTA_HC_PORTBLAIR',  label: 'Calcutta HC, Port Blair Circuit Bench',                        short: 'Calcutta HC – Port Blair',    state: 'A&N Islands' },
  { value: 'CALCUTTA_HC_JALPAIGURI', label: 'Calcutta HC, Jalpaiguri Circuit Bench',                        short: 'Calcutta HC – Jalpaiguri',    state: 'West Bengal' },
  { value: 'MADRAS_HC_FULL',         label: 'High Court of Judicature at Madras (Chennai)',                 short: 'Madras HC – Chennai',         state: 'Tamil Nadu' },
  { value: 'MADURAI_BENCH_FULL',     label: 'Madurai Bench of Madras High Court',                           short: 'Madras HC – Madurai',         state: 'Tamil Nadu' },
  { value: 'DELHI_HC',               label: 'High Court of Delhi',                                          short: 'Delhi HC',                    state: 'Delhi' },
  { value: 'PRAYAGRAJ_HC',           label: 'High Court of Judicature at Allahabad (Prayagraj)',            short: 'Allahabad HC – Prayagraj',    state: 'Uttar Pradesh' },
  { value: 'LUCKNOW_BENCH',          label: 'Allahabad HC, Lucknow Bench',                                  short: 'Allahabad HC – Lucknow',      state: 'Uttar Pradesh' },
  { value: 'KARNATAKA_HC',           label: 'High Court of Karnataka (Bengaluru)',                          short: 'Karnataka HC – Bengaluru',    state: 'Karnataka' },
  { value: 'KARNATAKA_HC_DHARWAD',   label: 'Karnataka HC, Dharwad Bench',                                  short: 'Karnataka HC – Dharwad',      state: 'Karnataka' },
  { value: 'KARNATAKA_HC_KALABURAGI', label: 'Karnataka HC, Kalaburagi Bench',                              short: 'Karnataka HC – Kalaburagi',   state: 'Karnataka' },
  { value: 'KERALA_HC',              label: 'High Court of Kerala (Ernakulam)',                             short: 'Kerala HC – Ernakulam',       state: 'Kerala' },
  { value: 'TELANGANA_HC',           label: 'High Court for the State of Telangana (Hyderabad)',            short: 'Telangana HC – Hyderabad',    state: 'Telangana' },
  { value: 'ANDHRA_HC',              label: 'High Court of Andhra Pradesh (Amaravati)',                     short: 'Andhra Pradesh HC',           state: 'Andhra Pradesh' },
  { value: 'GUJARAT_HC',             label: 'High Court of Gujarat (Ahmedabad)',                            short: 'Gujarat HC',                  state: 'Gujarat' },
  { value: 'PUNJAB_HARYANA_HC',      label: 'Punjab and Haryana High Court (Chandigarh)',                   short: 'P&H HC – Chandigarh',         state: 'Punjab/Haryana' },
  { value: 'RAJASTHAN_HC',           label: 'High Court of Rajasthan (Jodhpur)',                            short: 'Rajasthan HC – Jodhpur',      state: 'Rajasthan' },
  { value: 'RAJASTHAN_HC_JAIPUR',    label: 'Rajasthan HC, Jaipur Bench',                                   short: 'Rajasthan HC – Jaipur',       state: 'Rajasthan' },
  { value: 'MP_HC',                  label: 'High Court of Madhya Pradesh (Jabalpur)',                      short: 'MP HC – Jabalpur',            state: 'Madhya Pradesh' },
  { value: 'MP_HC_INDORE',           label: 'MP HC, Indore Bench',                                          short: 'MP HC – Indore',              state: 'Madhya Pradesh' },
  { value: 'MP_HC_GWALIOR',          label: 'MP HC, Gwalior Bench',                                         short: 'MP HC – Gwalior',             state: 'Madhya Pradesh' },
  { value: 'PATNA_HC',               label: 'High Court of Patna',                                          short: 'Patna HC',                    state: 'Bihar' },
  { value: 'JHARKHAND_HC',           label: 'High Court of Jharkhand (Ranchi)',                             short: 'Jharkhand HC – Ranchi',       state: 'Jharkhand' },
  { value: 'ORISSA_HC',              label: 'High Court of Orissa (Cuttack)',                               short: 'Orissa HC – Cuttack',         state: 'Odisha' },
  { value: 'CHHATTISGARH_HC',        label: 'High Court of Chhattisgarh (Bilaspur)',                        short: 'Chhattisgarh HC',             state: 'Chhattisgarh' },
  { value: 'UTTARAKHAND_HC',         label: 'High Court of Uttarakhand (Nainital)',                         short: 'Uttarakhand HC – Nainital',   state: 'Uttarakhand' },
  { value: 'HP_HC',                  label: 'High Court of Himachal Pradesh (Shimla)',                      short: 'HP HC – Shimla',              state: 'Himachal Pradesh' },
  { value: 'JK_HC',                  label: 'High Court of J&K and Ladakh (Srinagar/Jammu)',                short: 'J&K HC',                      state: 'J&K / Ladakh' },
  { value: 'SIKKIM_HC',              label: 'High Court of Sikkim (Gangtok)',                               short: 'Sikkim HC',                   state: 'Sikkim' },
  { value: 'TRIPURA_HC',             label: 'High Court of Tripura (Agartala)',                             short: 'Tripura HC',                  state: 'Tripura' },
  { value: 'MEGHALAYA_HC',           label: 'High Court of Meghalaya (Shillong)',                           short: 'Meghalaya HC',                state: 'Meghalaya' },
  { value: 'MANIPUR_HC',             label: 'High Court of Manipur (Imphal)',                               short: 'Manipur HC',                  state: 'Manipur' },
  { value: 'GAUHATI_HC',             label: 'High Court of Gauhati (Guwahati)',                             short: 'Gauhati HC – Guwahati',       state: 'Assam' },
  { value: 'GAUHATI_HC_AIZAWL',      label: 'Gauhati HC, Aizawl Bench',                                     short: 'Gauhati HC – Aizawl',         state: 'Mizoram' },
  { value: 'GAUHATI_HC_KOHIMA',      label: 'Gauhati HC, Kohima Bench',                                     short: 'Gauhati HC – Kohima',         state: 'Nagaland' },
  { value: 'GAUHATI_HC_ITANAGAR',    label: 'Gauhati HC, Itanagar Bench',                                   short: 'Gauhati HC – Itanagar',       state: 'Arunachal Pradesh' },
]

// Map state code → state info, for quick lookup.
export const STATE_BY_CODE = STATES.reduce((acc, s) => { acc[s.code] = s; return acc }, {})

// Convert "Some District (Alt Name)" → "Some District" for value generation.
function _stripParenthetical(name) {
  return name.replace(/\s*\([^)]*\)/g, '').trim()
}

// Convert a district display name into a SCREAMING_SNAKE_CASE token suitable
// for use inside the COURT value. Removes non-alphanumeric chars.
function _toToken(name) {
  return _stripParenthetical(name)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

// ─── Generate the full district-court list for a state ────────────
// For each district we emit a "DISTRICT_<STATE>_<DISTRICT>" entry.
// The label uses the state code-based prefix that the AI prompt builder
// already understands ("DISTRICT_<DIST>" pattern in `courtAddendum`).
export function buildDistrictCourts(state) {
  return state.districts.map(d => {
    const tok = _toToken(d)
    const cleaned = _stripParenthetical(d)
    return {
      value: `DC_${state.code}_${tok}`,
      label: `District & Sessions Court, ${cleaned} (${state.name})`,
      short: `District Court, ${cleaned}`,
      state: state.name,
      district: cleaned,
      stateCode: state.code,
      hcValue: state.hcValue,
    }
  })
}

// One flat array: every district court in India.
export const ALL_DISTRICT_COURTS = STATES.flatMap(buildDistrictCourts)

// ─── Generate state-specific specialised courts ──────────────────
// For each state's HC city we add Family / Labour / Consumer / Rent
// equivalents. We don't try to enumerate every district's specialised
// court (there are thousands) — this gives sensible options for
// the most common filings and the AI prompt fills in the gaps.
const _capitalCourtCity = {
  AP: 'Vijayawada', AR: 'Itanagar', AS: 'Guwahati', BR: 'Patna',
  CG: 'Bilaspur', GA: 'Panaji', GJ: 'Ahmedabad', HR: 'Chandigarh',
  HP: 'Shimla', JH: 'Ranchi', KA: 'Bengaluru', KL: 'Ernakulam',
  MP: 'Bhopal', MH: 'Mumbai', MN: 'Imphal', ML: 'Shillong',
  MZ: 'Aizawl', NL: 'Kohima', OD: 'Cuttack', PB: 'Chandigarh',
  RJ: 'Jaipur', SK: 'Gangtok', TN: 'Chennai', TG: 'Hyderabad',
  TR: 'Agartala', UP: 'Lucknow', UK: 'Dehradun', WB: 'Kolkata',
  AN: 'Port Blair', CH: 'Chandigarh', DN: 'Daman', DL: 'New Delhi',
  JK: 'Srinagar', LA: 'Leh', LD: 'Kavaratti', PY: 'Puducherry',
}

export const STATE_SPECIALISED_COURTS = STATES.flatMap(s => {
  const city = _capitalCourtCity[s.code] || s.districts[0]
  return [
    { value: `FAMILY_${s.code}`,   label: `Family Court, ${city} (${s.name})`,                              short: `Family Court, ${city}`,         state: s.name, district: city, stateCode: s.code, hcValue: s.hcValue },
    { value: `LABOUR_${s.code}`,   label: `Labour Court, ${city} (${s.name})`,                              short: `Labour Court, ${city}`,         state: s.name, district: city, stateCode: s.code, hcValue: s.hcValue },
    { value: `CONSUMER_${s.code}`, label: `District Consumer Disputes Redressal Commission, ${city} (${s.name})`, short: `Consumer Forum, ${city}`, state: s.name, district: city, stateCode: s.code, hcValue: s.hcValue },
    { value: `RENT_${s.code}`,     label: `Rent Controller, ${city} (${s.name})`,                           short: `Rent Controller, ${city}`,      state: s.name, district: city, stateCode: s.code, hcValue: s.hcValue },
    { value: `STATE_CONSUMER_${s.code}`, label: `State Consumer Disputes Redressal Commission, ${s.name}`, short: `State Consumer Comm., ${s.name}`, state: s.name, district: city, stateCode: s.code, hcValue: s.hcValue },
  ]
})

// ─── Convenience: every court entry, fully flat ───────────────────
export const FLAT_COURTS = [
  ...NATIONAL_TRIBUNALS,
  ...ALL_HIGH_COURTS,
  ...STATE_SPECIALISED_COURTS,
  ...ALL_DISTRICT_COURTS,
]

// ─── Group courts by state for the UI's grouped picker ────────────
export const COURTS_BY_STATE = STATES.map(s => ({
  code: s.code,
  state: s.name,
  hcValue: s.hcValue,
  courts: [
    // HCs of this state
    ...ALL_HIGH_COURTS.filter(hc => hc.state === s.name),
    // Specialised courts for this state
    ...STATE_SPECIALISED_COURTS.filter(c => c.stateCode === s.code),
    // Every district & sessions court in this state
    ...buildDistrictCourts(s),
  ],
}))

// ─── Lookup helpers ──────────────────────────────────────────────
const _byValue = FLAT_COURTS.reduce((acc, c) => { acc[c.value] = c; return acc }, {})

export function findCourt(value) {
  return _byValue[value] || null
}

export function statesAndUTs() {
  return STATES.map(s => ({ code: s.code, name: s.name, districts: s.districts.length }))
}
