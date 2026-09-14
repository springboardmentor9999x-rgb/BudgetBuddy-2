def test_monthly_report_json_and_pdf_generation(client, user_a_headers):
    # 1. JSON Report
    res_json = client.get("/reports/monthly?month=8&year=2026", headers=user_a_headers)
    assert res_json.status_code == 200
    data = res_json.json()
    assert data["month"] == 8
    assert data["year"] == 2026
    assert "total_income" in data

    # 2. PDF Report with empty/minimal data
    res_pdf = client.get("/reports/export/pdf?month=8&year=2026", headers=user_a_headers)
    assert res_pdf.status_code == 200
    assert res_pdf.headers["content-type"] == "application/pdf"
    assert "attachment; filename=" in res_pdf.headers["content-disposition"]
    assert len(res_pdf.content) > 0
