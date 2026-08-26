def test_savings_goals_crud_and_contributions(client, user_a_headers, user_b_headers):
    # Setup Account for User A
    res_acc = client.post("/accounts", headers=user_a_headers, json={
        "bank_name": "Test Bank",
        "account_name": "Test Acc",
        "account_type": "Bank Account",
        "opening_balance": 100000
    })
    assert res_acc.status_code == 201
    account_id = res_acc.json()["id"]

    # 1. Create Goal for User A
    res = client.post("/goals", headers=user_a_headers, json={
        "title": "New Laptop",
        "target_amount": 50000,
        "current_amount": 0,
        "target_date": "2026-12-30T00:00:00",
        "goal_type": "electronics",
        "status": "in_progress"
    })
    assert res.status_code == 201
    goal = res.json()
    assert goal["title"] == "New Laptop"
    assert goal["target_amount"] == 50000.0
    assert goal["remaining_amount"] == 50000.0
    assert goal["progress_percentage"] == 0.0
    goal_id = goal["id"]

    # Past Target Date Rejection Check
    res_past = client.post("/goals", headers=user_a_headers, json={
        "title": "Invalid Goal",
        "target_amount": 10000,
        "current_amount": 0,
        "target_date": "2020-01-01T00:00:00",
        "goal_type": "electronics"
    })
    assert res_past.status_code == 422
    assert "past" in res_past.json()["detail"].lower()

    # 2. Get Goals for User A
    res_list = client.get("/goals", headers=user_a_headers)
    assert res_list.status_code == 200
    assert len(res_list.json()) == 1

    # 3. Ownership Isolation: User B cannot get User A's goal
    res_b = client.get(f"/goals/{goal_id}", headers=user_b_headers)
    assert res_b.status_code == 404

    # 4. Update Goal
    res_upd = client.put(f"/goals/{goal_id}", headers=user_a_headers, json={
        "title": "Gaming Laptop"
    })
    assert res_upd.status_code == 200
    assert res_upd.json()["title"] == "Gaming Laptop"

    # 5. Contribute to Goal: 25% milestone (₹12,500)
    res_c1 = client.patch(f"/goals/{goal_id}/contribute", headers=user_a_headers, json={"amount": 12500, "account_id": account_id})
    assert res_c1.status_code == 200
    assert res_c1.json()["goal"]["current_amount"] == 12500.0
    assert res_c1.json()["goal"]["progress_percentage"] == 25.0

    # Verify 25% milestone notification created
    notifs = client.get("/notifications", headers=user_a_headers).json()

    # 6. Negative & Excessive Contribution Rejection
    res_neg = client.patch(f"/goals/{goal_id}/contribute", headers=user_a_headers, json={"amount": -500, "account_id": account_id})
    assert res_neg.status_code in (400, 422)

    res_excess = client.patch(f"/goals/{goal_id}/contribute", headers=user_a_headers, json={"amount": 100000, "account_id": account_id})
    assert res_excess.status_code == 400

    # 7. Complete Goal: Contribute remaining ₹37,500
    res_c2 = client.patch(f"/goals/{goal_id}/contribute", headers=user_a_headers, json={"amount": 37500, "account_id": account_id})
    assert res_c2.status_code == 200
    assert res_c2.json()["goal"]["status"] == "completed"
    assert res_c2.json()["goal"]["progress_percentage"] == 100.0

    # Verify 100% completion notification created
    notifs2 = client.get("/notifications", headers=user_a_headers).json()
    assert any("completed" in n["message"].lower() for n in notifs2)

    # 8. User B cannot delete User A's goal
    res_del_b = client.delete(f"/goals/{goal_id}", headers=user_b_headers)
    assert res_del_b.status_code == 404

    # 9. User A deletes goal
    res_del_a = client.delete(f"/goals/{goal_id}", headers=user_a_headers)
    assert res_del_a.status_code == 200
