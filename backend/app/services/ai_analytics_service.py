import os
import json
import urllib.request
import urllib.error
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.booking import Booking
from app.models.stall import Stall
from app.models.admin import AdminUser
from app.config import settings

def get_gemini_api_key() -> str:
    """Retrieve Gemini API key from settings or environment."""
    return os.environ.get("GEMINI_API_KEY", settings.GEMINI_API_KEY or "").strip()

def call_gemini_api(prompt: str, api_key: str = None) -> str | None:
    """Call Google Gemini API with the provided prompt."""
    key = api_key or get_gemini_api_key()
    if not key or len(key) < 10:
        return None

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={key}"
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 1024,
        }
    }

    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=3) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            candidates = res_data.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                if parts:
                    return parts[0].get("text", "").strip()
    except Exception:
        pass

    return None

def get_stall_metrics_snapshot(db: Session) -> dict:
    """Gather live data metrics for AI analysis."""
    stall = db.query(Stall).first()
    stall_name = stall.stall_name if stall else "सदिच्छा कला केंद्र"
    stall_number = stall.stall_number if stall else "स्टॉल क्र.१०"

    all_bookings = db.query(Booking).all()
    total_bookings = len(all_bookings)
    booked_count = sum(1 for b in all_bookings if b.booking_status == "BOOKED")
    paid_count = sum(1 for b in all_bookings if b.booking_status == "PAID")
    cancelled_count = sum(1 for b in all_bookings if b.booking_status == "CANCELLED")

    active_bookings = [b for b in all_bookings if b.booking_status != "CANCELLED"]
    total_business_value = sum(float(b.total_amount or 0) for b in active_bookings)

    total_cash = 0.0
    total_upi = 0.0
    total_pending = 0.0
    owner_map = {}

    today_str = datetime.now().strftime("%d/%m/%Y")
    today_bookings_count = 0
    today_cash = 0.0
    today_upi = 0.0

    for b in all_bookings:
        adv = float(b.advance_amount or 0)
        bal = float(b.balance_amount or 0)
        mode = (b.payment_mode or "").upper()
        owner = b.booked_by_owner or "इतर"

        if b.booking_status == "BOOKED":
            total_pending += bal

        if "कॅश" in mode or "CASH" in mode:
            total_cash += adv
        else:
            total_upi += adv

        if owner not in owner_map:
            owner_map[owner] = {"name": owner, "count": 0, "cash": 0.0, "upi": 0.0, "total": 0.0}
        owner_map[owner]["count"] += 1
        if "कॅश" in mode or "CASH" in mode:
            owner_map[owner]["cash"] += adv
        else:
            owner_map[owner]["upi"] += adv
        owner_map[owner]["total"] += adv

        # Today's check
        b_date = b.booking_date or ""
        if b_date == today_str:
            today_bookings_count += 1
            if "कॅश" in mode or "CASH" in mode:
                today_cash += adv
            else:
                today_upi += adv

    total_received = total_cash + total_upi
    collection_rate = (total_received / total_business_value * 100) if total_business_value > 0 else 0

    # Top 5 pending customers
    pending_customers = sorted(
        [b for b in active_bookings if float(b.balance_amount or 0) > 0],
        key=lambda x: float(x.balance_amount or 0),
        reverse=True
    )[:5]

    top_pending = [
        {
            "bookingId": b.booking_id,
            "customerName": b.customer_name,
            "mobileNumber": b.mobile_number,
            "statueNumber": b.statue_number,
            "balanceAmount": float(b.balance_amount or 0),
            "totalAmount": float(b.total_amount or 0),
            "bookingDate": b.booking_date,
            "bookedByOwner": b.booked_by_owner
        }
        for b in pending_customers
    ]

    return {
        "stallName": stall_name,
        "stallNumber": stall_number,
        "totalBookings": total_bookings,
        "bookedCount": booked_count,
        "paidCount": paid_count,
        "cancelledCount": cancelled_count,
        "totalBusinessValue": total_business_value,
        "totalReceived": total_received,
        "totalCash": total_cash,
        "totalUpi": total_upi,
        "totalPending": total_pending,
        "collectionRate": round(collection_rate, 1),
        "ownerStats": list(owner_map.values()),
        "topPending": top_pending,
        "todayBookings": today_bookings_count,
        "todayCash": today_cash,
        "todayUpi": today_upi,
        "todayTotal": today_cash + today_upi
    }

def generate_ai_business_insights(db: Session) -> dict:
    """Generate comprehensive AI business insights with Gemini or Statistical Fallback."""
    metrics = get_stall_metrics_snapshot(db)
    api_key = get_gemini_api_key()

    # Calculate Health Score (0 to 100)
    cr = metrics["collectionRate"]
    if cr >= 80:
        health_label = "उत्कृष्ट 🚀 (कलेक्शन गती मजबूत)"
        health_color = "var(--success)"
        health_score = 92
    elif cr >= 60:
        health_label = "चांगले 👍 (सामान्य वसुली)"
        health_color = "var(--primary)"
        health_score = 75
    elif cr >= 40:
        health_label = "मध्यम ⚡ (बाकी वसुली वाढवा)"
        health_color = "var(--accent)"
        health_score = 55
    else:
        health_label = "लक्ष द्या ⚠️ (कमी ॲडव्हान्स)"
        health_color = "var(--danger)"
        health_score = 35

    ai_generated_summary = None
    ai_generated_highlights = None
    is_gemini = False

    if api_key:
        prompt = f"""
तुम्ही '{metrics["stallName"]}' या गणपती मूर्ती स्टॉलचे AI व्यावसायिक सल्लागार (AI Business Advisor) आहात.
खालील स्टॉल डेटाचा वापर करून मालकांना समजेल अशा शुद्ध व प्रेरणादायी मराठी भाषेत अंतर्दृष्टी (Business Insights) द्या.

[स्टॉल डेटा]:
- एकूण व्यवसाय: ₹{metrics["totalBusinessValue"]:,.0f}
- एकूण जमा: ₹{metrics["totalReceived"]:,.0f} (रोख: ₹{metrics["totalCash"]:,.0f}, UPI: ₹{metrics["totalUpi"]:,.0f})
- शिल्लक बाकी रक्कम: ₹{metrics["totalPending"]:,.0f}
- बुकिंग स्थिती: एकूण {metrics["totalBookings"]} (पूर्ण जमा: {metrics["paidCount"]}, चालू: {metrics["bookedCount"]}, रद्द: {metrics["cancelledCount"]})
- कलेक्शन दर: {metrics["collectionRate"]}%
- मालक कामगिरी: {metrics["ownerStats"]}
- आजचे संकलन: ₹{metrics["todayTotal"]:,.0f} (बुकिंग्ज: {metrics["todayBookings"]})

कृपया खालील JSON फॉरमॅटमध्येच उत्तर द्या, इतर कोणताही मजकूर लिहू नका:
{{
  "executiveSummary": "थोडक्यात २ वाक्यांत व्यवसायाचा आढावा आणि मार्गदर्शन (मराठीत)",
  "highlights": [
    "ठळक विश्लेषण १ (कलेक्शन व पेमेंट ट्रेंड)",
    "ठळक विश्लेषण २ (बाकी रक्कम वसुली सूचना)",
    "ठळक विश्लेषण ३ (मालक कामगिरी किंवा इन्व्हेंटरी सल्ला)"
  ],
  "recommendations": [
    "सल्ला १",
    "सल्ला २"
  ]
}}
"""
        raw_res = call_gemini_api(prompt, api_key)
        if raw_res:
            try:
                clean_json = raw_res.replace("```json", "").replace("```", "").strip()
                parsed = json.loads(clean_json)
                ai_generated_summary = parsed.get("executiveSummary")
                ai_generated_highlights = parsed.get("highlights")
                is_gemini = True
            except Exception as e:
                print(f"[JSON Parse Error from Gemini] {e}")

    # Fallback to Statistical Template if Gemini was unavailable or errored
    if not ai_generated_summary:
        cash_pct = round((metrics["totalCash"] / metrics["totalReceived"] * 100), 1) if metrics["totalReceived"] > 0 else 0
        upi_pct = round(100 - cash_pct, 1)
        ai_generated_summary = (
            f"{metrics['stallName']} मध्ये सध्या एकूण ₹{metrics['totalBusinessValue']:,.0f} चा व्यवसाय नोंदवला गेला असून "
            f"₹{metrics['totalReceived']:,.0f} ({metrics['collectionRate']}%) रक्कम यशस्वीरीत्या संकलित झाली आहे. "
            f"उर्वरित ₹{metrics['totalPending']:,.0f} बाकी वसुलीसाठी नियोजन आवश्यक आहे."
        )
        ai_generated_highlights = [
            f"💳 पेमेंट प्रकार: {cash_pct}% रोख (Cash) व {upi_pct}% UPI द्वारे संकलन झाले आहे.",
            f"⏳ बाकी रक्कम: एकूण ₹{metrics['totalPending']:,.0f} येणे बाकी आहे. टॉप {len(metrics['topPending'])} ग्राहकांकडे मोठी रक्कम थकीत आहे.",
            f"👥 बुकिंग्स: एकूण {metrics['totalBookings']} मूर्तींपैकी {metrics['paidCount']} पूर्ण जमा व {metrics['bookedCount']} अद्याप चालू आहेत."
        ]

    # Pre-formatted Marathi WhatsApp Daily Report
    daily_report_whatsapp = (
        f"🌺 *{metrics['stallName']} - दैनिक व्यवसाय अहवाल* 🌺\n"
        f"📅 दिनांक: {datetime.now().strftime('%d/%m/%Y %I:%M %p')}\n\n"
        f"📊 *व्यवसाय सारांश:*\n"
        f"• एकूण बुकिंग्ज: *{metrics['totalBookings']}*\n"
        f"• एकूण व्यवसाय: *₹{metrics['totalBusinessValue']:,.0f}*\n"
        f"• एकूण जमा रक्कम: *₹{metrics['totalReceived']:,.0f}* ({metrics['collectionRate']}%)\n"
        f"  - 💵 रोख (Cash): ₹{metrics['totalCash']:,.0f}\n"
        f"  - 📱 ऑनलाईन (UPI): ₹{metrics['totalUpi']:,.0f}\n"
        f"• ⚠️ बाकी येणे: *₹{metrics['totalPending']:,.0f}*\n\n"
        f"👥 *सह-मालक संकलन तपशील:*\n"
    )
    for o in metrics["ownerStats"]:
        daily_report_whatsapp += f"• *{o['name']}*: {o['count']} बुकिंग्ज | जमा: ₹{o['total']:,.0f}\n"
    daily_report_whatsapp += "\n🚩 *॥ गणपती बाप्पा मोरया ॥* 🚩"

    return {
        "success": True,
        "isAiPowered": is_gemini,
        "healthScore": health_score,
        "healthLabel": health_label,
        "healthColor": health_color,
        "metrics": metrics,
        "executiveSummary": ai_generated_summary,
        "highlights": ai_generated_highlights,
        "dailyReportWhatsapp": daily_report_whatsapp,
        "topPending": metrics["topPending"]
    }

def ask_ai_query(db: Session, query: str) -> dict:
    """Answer natural language queries from owners in Marathi, English, and Minglish (Roman Marathi)."""
    metrics = get_stall_metrics_snapshot(db)
    api_key = get_gemini_api_key()
    q_clean = (query or "").strip()

    if not q_clean:
        return {"success": False, "message": "कृपया प्रश्न टाका."}

    today_str = datetime.now().strftime("%d/%m/%Y")

    # If Gemini API key is available, call Gemini with structured multilingual prompt
    if api_key:
        prompt = f"""
तुम्ही '{metrics["stallName"]}' ({metrics["stallNumber"]}) या गणपती मूर्ती स्टॉलचे AI बिझनेस मॅनेजर (AI Business Assistant) आहात.
मालकाने (Owner) विचारलेल्या प्रश्नाचे खालील स्टॉल डेटाच्या आधारे १००% अचूक, मुद्देसूद आणि आदराने मराठीत (Devanagari) उत्तर द्या.

[भाषा नियम (IMPORTANT)]:
1. वापरकर्त्याने मराठी (उदा. 'आजचे एकूण संकलन किती?'), इंग्रजी (उदा. 'What is today's total collection?'), किंवा मिंग्लिश / रोमन मराठी (उदा. 'aajche ekun sankalan kiti?', 'sarvat jast baki konakade ahe?', 'shiv ne kiti booking kelya?') यापैकी कोणत्याही भाषेत प्रश्न विचारला तरी त्याचा अर्थ समजून घ्या.
2. उत्तर नेहमी शुद्ध, स्पष्ट, नम्र व वाचायला सोप्या अशा **मराठी देवनागरी लिपीतच** द्या.
3. पैशांची आकडेमोड स्पष्टपणे **₹ (रुपये)** चिन्हासह ठळक अक्षरात (bold) लिहा.

[स्टॉल लाइव्ह डेटा ({today_str})]:
- एकूण व्यवसाय मूल्य (Total Business Value): ₹{metrics["totalBusinessValue"]:,.0f}
- एकूण जमा रक्कम (Total Received): ₹{metrics["totalReceived"]:,.0f} ({metrics["collectionRate"]}%)
  • रोख संकलन (Cash): ₹{metrics["totalCash"]:,.0f}
  • UPI / ऑनलाईन संकलन (Online): ₹{metrics["totalUpi"]:,.0f}
- शिल्लक बाकी रक्कम (Total Pending): ₹{metrics["totalPending"]:,.0f}
- एकूण बुकिंग्ज संख्या: {metrics["totalBookings"]} (पूर्ण जमा: {metrics["paidCount"]}, चालू बाकी: {metrics["bookedCount"]}, रद्द: {metrics["cancelledCount"]})
- आजचे संकलन ({today_str}):
  • आजचे बुकिंग्ज: {metrics["todayBookings"]}
  • आजची रोख (Cash): ₹{metrics["todayCash"]:,.0f}
  • आजचे UPI: ₹{metrics["todayUpi"]:,.0f}
  • आजचे एकूण संकलन: ₹{metrics["todayTotal"]:,.0f}
- सह-मालक कामगिरी (Owner Performance):
{json.dumps(metrics["ownerStats"], ensure_ascii=False, indent=2)}
- टॉप बाकीदार ग्राहक (Top Pending Debtors):
{json.dumps(metrics["topPending"], ensure_ascii=False, indent=2)}

[मालकाचा प्रश्न]:
"{q_clean}"

कृपया वरील डेटाच्या आधारे अचूक, संक्षिप्त आणि परिपूर्ण मराठीत उत्तर द्या:
"""
        ai_response = call_gemini_api(prompt, api_key)
        if ai_response:
            return {
                "success": True,
                "query": q_clean,
                "answer": ai_response,
                "source": "gemini"
            }

    # =========================================================================
    # ADVANCED MULTILINGUAL HEURISTIC & SEMANTIC OFFLINE ENGINE (Marathi, English & Minglish)
    # =========================================================================
    import re
    q_norm = q_clean.lower()
    q_spaced = " " + q_norm + " "

    def has_any(keyword_list):
        for kw in keyword_list:
            kw_l = kw.lower()
            # If short ascii word (<=3 letters like 'hi'), strictly match whole word
            if len(kw_l) <= 3 and kw_l.isascii():
                if re.search(r'\b' + re.escape(kw_l) + r'\b', q_spaced):
                    return True
            else:
                if kw in q_clean or kw_l in q_norm or kw_l in q_spaced:
                    return True
                if re.search(r'\b' + re.escape(kw_l) + r'\b', q_spaced):
                    return True
        return False

    # 1. GREETINGS & SMALL TALK (Only if short query or explicit greeting phrase)
    greeting_words = ["hi", "hello", "hey", "namaskar", "namaste", "ram ram", "pranam", "bappa", "morya", "ganpati", "नमस्कार", "राम राम", "प्रणाम", "मोरया", "गणपती"]
    if has_any(greeting_words) and (len(q_norm.split()) <= 3 or not has_any(["sankalan", "jama", "baki", "pending", "owner", "cash", "upi", "booking", "व्यवसाय", "रक्कम", "किती", "kiti", "plan", "strategy"])):
        answer = (
            f"🚩 **॥ गणपती बाप्पा मोरया ॥** 🚩\n\n"
            f"नमस्कार! मी **{metrics['stallName']}** चा AI सहाय्यक आहे.\n"
            f"तुम्ही मला आजचे संकलन, शिल्लक बाकी, रोख/UPI तपशील, वसुली नियोजन किंवा मालकांची कामगिरी विचारू शकता.\n"
            f"💡 *उदा. 'aajche sankalan kiti?', 'पुढील ३ दिवसांची बाकी वसुली रणनीती काय असावी?', 'रोख आणि UPI चे प्रमाण काय आहे?'*"
        )

    # 2. ACTIONABLE RECOVERY STRATEGY & PLANNING (बाकी वसुली रणनीती व नियोजन)
    elif (has_any(["planning", "strategy", "रणनीती", "नियोजन", "plan", "कशी करावी", "कसे करावे", "recovery", "vasuli", "action plan", "३ दिवस", "3 days", "मार्गदर्शन", "सल्ला"])
          and has_any(["baki", "pending", "thakit", "balance", "रक्कम", "वसूल", "वसुली", "amount", "collect", "collection"])):
        top_list = metrics.get("topPending", [])
        top_debtor_names = ", ".join([f"{c['customerName']} (₹{c['balanceAmount']:,.0f})" for c in top_list[:3]]) if top_list else "सर्व ग्राहक"
        
        answer = (
            f"🎯 **पुढील ३ दिवसांची स्मार्ट बाकी वसुली रणनीती (Action Plan):**\n\n"
            f"📊 **सद्यस्थिती:** एकूण **₹{metrics['totalPending']:,.0f}** येणे बाकी असून **{metrics['bookedCount']}** ग्राहकांकडे रक्कम थकीत आहे.\n\n"
            f"📌 **१. दिवस १ (डिजिटल आठवण):**\n"
            f"• सर्वाधिक बाकी असणाऱ्या टॉप ग्राहकांना ({top_debtor_names}) डॅशबोर्डवरील **'आठवण पाठवा'** बटणाने त्वरित WhatsApp पेमेंट आठवण मेसेज पाठवा.\n\n"
            f"📌 **२. दिवस २ (मालक वैयक्तिक फॉलो-अप):**\n"
            f"• ज्या सह-मालकाने बुकिंग घेतले आहे त्यांनी ग्राहकांशी थेट फोनवरून बोलून रक्कम ऑनलाईन (UPI) द्वारे आधीच भरण्याची विनंती करावी.\n\n"
            f"📌 **३. दिवस ३ (मूर्ती नेण्याच्या वेळेस वसुली):**\n"
            f"• स्टॉलवर मूर्ती नेण्यासाठी ग्राहक येण्यापूर्वी बिल तयार ठेवा. काऊंटरवर **UPI QR कोड स्टँड** व कॅश हिशोब तयार ठेवून पूर्ण रक्कम (100%) जमा झाल्यानंतरच मूर्ती रवाना करावी.\n\n"
            f"💡 *अंदाज: या नियोजनामुळे पुढील ३ दिवसांत किमान ७०% ते ८०% बाकी रक्कम सहज वसूल होईल!*"
        )

    # 3. CASH VS UPI RATIO & COMPARISON (रोख आणि UPI चे प्रमाण / टक्केवारी)
    elif (has_any(["प्रमाण", "ratio", "percentage", "टक्केवारी", "तुलना", "compare", "split", "praman", "दोन्ही", "both"])
          or (has_any(["rokh", "cash", "कॅश", "रोख"]) and has_any(["upi", "online", "ऑनलाईन", "ऑनलाइन"]))):
        tot = metrics['totalReceived']
        cash_pct = round((metrics['totalCash'] / tot * 100), 1) if tot > 0 else 0
        upi_pct = round((metrics['totalUpi'] / tot * 100), 1) if tot > 0 else 0
        
        answer = (
            f"💳 **रोख (Cash) आणि UPI / ऑनलाईन पेमेंट प्रमाण:**\n\n"
            f"• 💵 **रोख (Cash):** **₹{metrics['totalCash']:,.0f}** ({cash_pct}%)\n"
            f"• 📱 **UPI / ऑनलाईन:** **₹{metrics['totalUpi']:,.0f}** ({upi_pct}%)\n"
            f"• 📊 **एकूण संकलित रक्कम:** **₹{tot:,.0f}** (100%)\n\n"
            f"💡 **निष्कर्ष:** स्टॉलवर सर्वाधिक **{cash_pct}%** संकलन रोख (Cash) द्वारे झाले आहे. ग्राहकांसाठी UPI QR कोड काऊंटरवर अधिक ठळकपणे लावल्यास रोख हाताळणी कमी होईल."
        )

    # 4. TOP PENDING CUSTOMERS / WHO OWES MOST / HIGHEST PENDING AMOUNT
    elif (has_any(["sarvat jast", "sarvat mothi", "highest", "top", "maximum", "सर्वात जास्त", "सर्वाधिक", "konakade", "konache", "who", "कोणाकडे", "कोणाची", "top pending", "baki list", "pending list", "debtor", "debtors", "यादी", "list", "dakhva", "sang", "give me highest"])
          and has_any(["baki", "pending", "thakit", "balance", "बाकी", "थकीत", "रक्कम", "dues", "dene", "amount"])):
        top_list = metrics.get("topPending", [])
        if not top_list:
            answer = "🎉 **सध्या कोणत्याही ग्राहकाकडे मोठी बाकी रक्कम शिल्लक नाही!** सर्व पेमेंट पूर्ण झाले आहे."
        else:
            first_c = top_list[0]
            lines = [
                f"⚠️ **सर्वात जास्त बाकी असणारे टॉप {len(top_list)} ग्राहक:**\n",
                f"🥇 **सर्वाधिक बाकी:** 👤 **{first_c['customerName']}** यांच्याकडे **₹{first_c['balanceAmount']:,.0f}** बाकी शिल्लक आहे (मूर्ती क्र. **{first_c['statueNumber']}** | 📞 `{first_c['mobileNumber']}`).\n",
                f"📋 **संपूर्ण टॉप बाकी यादी:**"
            ]
            for idx, c in enumerate(top_list, 1):
                lines.append(
                    f"{idx}. 👤 **{c['customerName']}** (मूर्ती: **{c['statueNumber']}**)\n"
                    f"   • बाकी: **₹{c['balanceAmount']:,.0f}** (एकूण: ₹{c['totalAmount']:,.0f})\n"
                    f"   • फोन: 📞 `{c['mobileNumber']}` | बुकिंग: {c.get('bookedByOwner', '-')}"
                )
            lines.append(f"\n💡 एकूण शिल्लक बाकी: **₹{metrics['totalPending']:,.0f}** आहे ({metrics['bookedCount']} चालू बुकिंग्ज).")
            answer = "\n".join(lines)

    # 5. SPECIFIC OWNER PERFORMANCE (Dynamic Owner Lookup)
    elif any(
        (o["name"].lower() in q_spaced or
         (o["name"] == "शिव" and has_any(["shiv", "shiva", "shivane", "shivne", "shivche", "shivcha", "शिव", "शिवने", "शिवचे"])) or
         (o["name"] == "राहुल" and has_any(["rahul", "rahula", "rahulne", "rahulche", "rahulcha", "राहुल", "राहुलने", "राहुलचे"])) or
         (o["name"] == "हर्षद" and has_any(["harshad", "harshada", "harshadne", "harshadche", "हर्षद", "हर्षदने", "हर्षदचे"])) or
         (o["name"] == "अनिकेत" and has_any(["aniket", "aniketne", "aniketche", "अनिकेत"])) or
         (o["name"].lower() in q_norm)
        )
        for o in metrics.get("ownerStats", [])
    ):
        matched_owner = None
        for o in metrics.get("ownerStats", []):
            o_name = o["name"].lower()
            if (o_name in q_spaced or
                (o["name"] == "शिव" and has_any(["shiv", "shiva", "shivane", "shivne", "shivche", "shivcha", "शिव", "शिवने", "शिवचे"])) or
                (o["name"] == "राहुल" and has_any(["rahul", "rahula", "rahulne", "rahulche", "rahulcha", "राहुल", "राहुलने", "राहुलचे"])) or
                (o["name"] == "हर्षद" and has_any(["harshad", "harshada", "harshadne", "harshadche", "हर्षद", "हर्षदने", "हर्षदचे"])) or
                (o["name"] == "अनिकेत" and has_any(["aniket", "aniketne", "aniketche", "अनिकेत"])) or
                (o_name in q_norm)):
                matched_owner = o
                break

        if matched_owner:
            answer = (
                f"👤 **{matched_owner['name']} यांची कामगिरी:**\n"
                f"• एकूण बुकिंग्ज: **{matched_owner['count']}**\n"
                f"• एकूण जमा रक्कम: **₹{matched_owner['total']:,.0f}**\n"
                f"  - 💵 रोख (Cash): **₹{matched_owner['cash']:,.0f}**\n"
                f"  - 📱 UPI / ऑनलाईन: **₹{matched_owner['upi']:,.0f}**"
            )
        else:
            answer = "संबंधित मालकाची माहिती उपलब्ध नाही."

    # 6. TODAY'S COLLECTION & PERFORMANCE
    elif has_any(["aaj", "aajche", "aajch", "aajacha", "aajcha", "today", "todays", "today's", "आज", "आजचे", "आजचा", "आजचं"]):
        answer = (
            f"📅 **आजचा व्यवसाय अहवाल ({today_str}):**\n"
            f"• आजची नवीन बुकिंग्ज: **{metrics['todayBookings']}**\n"
            f"• आजचे एकूण संकलन: **₹{metrics['todayTotal']:,.0f}**\n"
            f"  - 💵 रोख (Cash): **₹{metrics['todayCash']:,.0f}**\n"
            f"  - 📱 UPI / ऑनलाईन: **₹{metrics['todayUpi']:,.0f}**"
        )

    # 7. PAYMENT MODE - CASH ONLY
    elif has_any(["rokh", "cash", "kash", "rok", "कॅश", "रोख", "नगद"]):
        answer = (
            f"💵 **रोख (Cash) संकलन तपशील:**\n"
            f"• स्टॉलवर आतापर्यंत एकूण **₹{metrics['totalCash']:,.0f}** रोख जमा झाले आहे.\n"
            f"• आजचे रोख संकलन: **₹{metrics['todayCash']:,.0f}** आहे."
        )

    # 8. PAYMENT MODE - UPI / ONLINE ONLY
    elif has_any(["upi", "online", "digital", "gpay", "phonepe", "scanner", "ऑनलाईन", "यूपीआय", "ऑनलाइन"]):
        answer = (
            f"📱 **UPI / ऑनलाईन संकलन तपशील:**\n"
            f"• स्टॉलवर आतापर्यंत एकूण **₹{metrics['totalUpi']:,.0f}** UPI द्वारे जमा झाले आहे.\n"
            f"• आजचे UPI संकलन: **₹{metrics['todayUpi']:,.0f}** आहे."
        )

    # 9. PENDING DUES & BALANCE
    elif has_any(["baki", "pending", "balance", "thakit", "yeils", "dene", "shillak", "remaining", "बाकी", "थकीत", "शिल्लक"]):
        answer = (
            f"⏳ **शिल्लक बाकी रक्कम तपशील:**\n"
            f"• एकूण बाकी रक्कम: **₹{metrics['totalPending']:,.0f}**\n"
            f"• चालू बाकी असणाऱ्या मूर्ती: **{metrics['bookedCount']}**\n"
            f"• एकूण कलेक्शन दर: **{metrics['collectionRate']}%** पूर्ण झाले आहे."
        )

    # 8. STATUE COUNT / INVENTORY / BOOKING STATUS BREAKDOWN
    elif has_any(["murti", "statue", "statues", "idols", "booking", "bookings", "संख्या", "मूर्ती", "स्टॅच्यू", "kiti"]):
        answer = (
            f"📋 **मूर्ती बुकिंग स्थिती तपशील:**\n"
            f"• एकूण नोंदणीकृत बुकिंग्ज: **{metrics['totalBookings']}**\n"
            f"  - 🟢 पूर्ण रक्कम जमा (PAID): **{metrics['paidCount']}**\n"
            f"  - 🟠 चालू बुकिंग (BOOKED/बाकी): **{metrics['bookedCount']}**\n"
            f"  - 🔴 रद्द बुकिंग्ज (CANCELLED): **{metrics['cancelledCount']}**"
        )

    # 9. CANCELLED BOOKINGS
    elif has_any(["radd", "cancel", "cancelled", "rad", "रद्द", "कॅन्सल"]):
        answer = f"🔴 आतापर्यंत एकूण **{metrics['cancelledCount']}** बुकिंग्ज रद्द (Cancelled) करण्यात आल्या आहेत."

    # 10. PAID / COMPLETED BOOKINGS
    elif has_any(["purna", "paid", "clear", "settled", "पूर्ण", "पेड"]):
        answer = f"🟢 आतापर्यंत एकूण **{metrics['paidCount']}** ग्राहकांचे पूर्ण पेमेंट (PAID) जमा झाले आहे."

    # 11. ALL OWNERS BREAKDOWN / COMPARISON
    elif has_any(["malak", "owner", "owners", "kamgiri", "perform", "sarv malak", "मालक", "कामगिरी", "सगळे"]):
        lines = ["👥 **सर्व सह-मालक संकलन तपशील:**\n"]
        for o in metrics.get("ownerStats", []):
            lines.append(f"• **{o['name']}**: {o['count']} बुकिंग्ज | एकूण जमा: **₹{o['total']:,.0f}** (रोख: ₹{o['cash']:,.0f}, UPI: ₹{o['upi']:,.0f})")
        answer = "\n".join(lines)

    # 12. TOTAL BUSINESS VALUE / OVERALL TURNOVER
    elif has_any(["ekun", "total", "turnover", "vyavsay", "turn over", "business", "sarv", "sagla", "एकूण", "व्यवसाय", "टर्नओव्हर"]):
        answer = (
            f"📊 **{metrics['stallName']} एकूण व्यवसाय सारांश:**\n"
            f"• एकूण व्यवसाय मूल्य: **₹{metrics['totalBusinessValue']:,.0f}**\n"
            f"• एकूण जमा रक्कम: **₹{metrics['totalReceived']:,.0f}** ({metrics['collectionRate']}%)\n"
            f"  - 💵 रोख (Cash): **₹{metrics['totalCash']:,.0f}**\n"
            f"  - 📱 UPI / ऑनलाईन: **₹{metrics['totalUpi']:,.0f}**\n"
            f"• ⏳ एकूण येणे बाकी: **₹{metrics['totalPending']:,.0f}**\n"
            f"• एकूण मूर्ती बुकिंग्ज: **{metrics['totalBookings']}** (पूर्ण जमा: {metrics['paidCount']}, चालू: {metrics['bookedCount']})"
        )

    # 13. DEFAULT SMART FALLBACK
    else:
        answer = (
            f"📊 **स्टॉल संक्षिप्त माहिती:**\n"
            f"• एकूण व्यवसाय: **₹{metrics['totalBusinessValue']:,.0f}**\n"
            f"• एकूण संकलन: **₹{metrics['totalReceived']:,.0f}** (रोख: ₹{metrics['totalCash']:,.0f}, UPI: ₹{metrics['todayUpi']:,.0f})\n"
            f"• येणे बाकी: **₹{metrics['totalPending']:,.0f}**\n"
            f"• आजचे संकलन: **₹{metrics['todayTotal']:,.0f}** ({metrics['todayBookings']} बुकिंग्ज)\n\n"
            f"💡 *टीप: तुम्ही 'aajche sankalan kiti?', 'sarvat jast baki konakade ahe?', किंवा 'shiv ne kiti kelya?' असे प्रश्न विचारू शकता.*"
        )

    return {
        "success": True,
        "query": q_clean,
        "answer": answer,
        "source": "statistical_engine"
    }

def save_gemini_api_key(api_key: str) -> dict:
    """Save and test the Gemini API key."""
    key = api_key.strip()
    if not key:
        os.environ["GEMINI_API_KEY"] = ""
        settings.GEMINI_API_KEY = ""
        return {"success": True, "message": "API Key काढून टाकण्यात आली आहे.", "configured": False}

    # Test key with a quick ping
    test_res = call_gemini_api("Give a 1-word greeting: Hello", key)
    if not test_res:
        return {"success": False, "message": "Gemini API Key अवैध आहे किंवा इंटरनेटशी संपर्क होत नाही. कृपया योग्य Key टाका.", "configured": False}

    os.environ["GEMINI_API_KEY"] = key
    settings.GEMINI_API_KEY = key
    
    # Try updating .env file
    try:
        env_path = os.path.join(os.path.dirname(__file__), "..", "..", ".env")
        if os.path.exists(env_path):
            with open(env_path, "r", encoding="utf-8") as f:
                content = f.read()
            if "GEMINI_API_KEY=" in content:
                lines = content.splitlines()
                new_lines = [
                    f"GEMINI_API_KEY={key}" if l.startswith("GEMINI_API_KEY=") else l
                    for l in lines
                ]
                with open(env_path, "w", encoding="utf-8") as f:
                    f.write("\n".join(new_lines) + "\n")
            else:
                with open(env_path, "a", encoding="utf-8") as f:
                    f.write(f"\nGEMINI_API_KEY={key}\n")
    except Exception as e:
        print(f"[Save API Key .env Warning] {e}")

    return {
        "success": True,
        "message": "🎉 Gemini 1.5 Flash AI API यशस्वीरीत्या जोडली गेली आहे!",
        "configured": True
    }
