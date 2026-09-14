def test_expenses_and_budget_exceeded_notification(client, user_a_headers):
    # 1. Create account for User A
    acc_res = client.post("/accounts", headers=user_a_headers, json={
        "bank_name": "HDFC Bank",
        "account_name": "Salary Account",
        "account_type": "Bank Account",
        "opening_balance": 50000.0,
        "last4": "1234"
    })
    acc_id = acc_res.json()["id"]

    # 2. Create Food Budget of ₹5,000 for August 2026
    b_res = client.post("/budgets", headers=user_a_headers, json={
        "category": "Food",
        "monthly_limit": 5000.0,
        "month": 8,
        "year": 2026
    })
    assert b_res.status_code == 201

    # 3. Create Food expense of ₹4,000 (within budget)
    e1 = client.post("/expenses", headers=user_a_headers, json={
        "account_id": acc_id,
        "title": "Groceries",
        "category": "Food",
        "amount": 4000.0,
        "payment_method": "UPI",
        "date": "2026-08-10T12:00:00",
        "description": "Weekly food supply"
    })
    assert e1.status_code == 201

    # Verify no budget alert notification yet
    n1 = client.get("/notifications", headers=user_a_headers).json()
    assert not any("Food budget has been exceeded" in item["message"] for item in n1)

    # 4. Create another Food expense of ₹1,500 (Total = ₹5,500 -> Exceeds budget)
    e2 = client.post("/expenses", headers=user_a_headers, json={
        "account_id": acc_id,
        "title": "Dinner Out",
        "category": "Food",
        "amount": 1500.0,
        "payment_method": "UPI",
        "date": "2026-08-11T19:00:00",
        "description": "Dinner with friends"
    })
    assert e2.status_code == 201

    # Verify budget exceeded notification IS created
    n2 = client.get("/notifications", headers=user_a_headers).json()
    alerts = [item for item in n2 if "You exceeded your" in item["message"] and "Food budget" in item["message"]]
    assert len(alerts) >= 1

    # 5. Create a 3rd Food expense of ₹500 (Duplicate notification prevention check)
    e3 = client.post("/expenses", headers=user_a_headers, json={
        "account_id": acc_id,
        "title": "Coffee",
        "category": "Food",
        "amount": 500.0,
        "payment_method": "UPI",
        "date": "2026-08-12T10:00:00",
        "description": "Cafe espresso"
    })
    assert e3.status_code == 201

    # Verify NO duplicate budget alert notification was created
    n3 = client.get("/notifications", headers=user_a_headers).json()
    alerts3 = [item for item in n3 if "You exceeded your" in item["message"] and "Food budget" in item["message"]]
    assert len(alerts3) == 1
