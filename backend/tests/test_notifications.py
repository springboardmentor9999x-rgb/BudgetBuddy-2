def test_notifications_listing_read_and_monthly_report(client, user_a_headers, user_b_headers):
    # 1. Generate monthly report notification
    res_gen = client.post("/notifications/generate-monthly-report?month=8&year=2026", headers=user_a_headers)
    assert res_gen.status_code == 201
    notif = res_gen.json()
    assert "August 2026" in notif["message"]
    assert notif["is_read"] is False
    notif_id = notif["id"]

    # 2. List notifications for User A
    res_list = client.get("/notifications", headers=user_a_headers)
    assert res_list.status_code == 200
    assert len(res_list.json()) == 1

    # 3. Ownership check: User B cannot access or mark read User A's notification
    res_read_b = client.patch(f"/notifications/{notif_id}/read", headers=user_b_headers)
    assert res_read_b.status_code == 404

    # 4. User A marks notification as read
    res_read_a = client.patch(f"/notifications/{notif_id}/read", headers=user_a_headers)
    assert res_read_a.status_code == 200
    assert res_read_a.json()["is_read"] is True
