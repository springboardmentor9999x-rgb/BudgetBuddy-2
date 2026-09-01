def test_analytics_endpoints(client, user_a_headers):
    # 1. Summary Endpoint
    res_sum = client.get("/analytics/summary", headers=user_a_headers)
    assert res_sum.status_code == 200
    data = res_sum.json()
    assert "total_income" in data
    assert "total_expenses" in data
    assert "remaining_balance" in data

    # 2. Spending by Category
    res_cat = client.get("/analytics/spending-by-category", headers=user_a_headers)
    assert res_cat.status_code == 200
    assert isinstance(res_cat.json(), list)

    # 3. Monthly Trend
    res_trend = client.get("/analytics/monthly-trend?months=6", headers=user_a_headers)
    assert res_trend.status_code == 200
    assert len(res_trend.json()) == 6

    # 4. Savings Progress
    res_sav = client.get("/analytics/savings-progress", headers=user_a_headers)
    assert res_sav.status_code == 200
    assert isinstance(res_sav.json(), list)

    # 5. Expense Distribution (Histogram)
    res_dist = client.get("/analytics/expense-distribution", headers=user_a_headers)
    assert res_dist.status_code == 200
    assert len(res_dist.json()) == 5
