const fetch_url = key.message_fetch_url;

async function use_premium(request_auth, uuid) {
    const response = await fetch(key.point_fetch_url,
        {
            method: "POST",
            body: JSON.stringify({
                "req": "use_premium",
                "id": "",
                "pass": "",
                "request_auth": request_auth,
                "uuid": uuid
            })
        })
        .then(res => {
            return res.text();
        })
        .then(data => {
            return JSON.parse(data);
        });

    return response.result == "ok";
}

async function replace_text(text, premium_free=false) {
    document.getElementById("status_for_premium").innerText = "";
    let result = text;
    let auth = false;
    let all_auth = false;

    if (premium_free) {
        auth = true;
        all_auth = true;
    } else {
        const premium_uuid = document.getElementById("premium_code").value;
        if (premium_uuid != "") {
            auth = await use_premium("h", premium_uuid);
            all_auth = await use_premium("hmn", premium_uuid);

            if (!auth) {
                document.getElementById("status_for_premium").innerText = "プレミアムコードが無効です！";
                return -1;
            }
        }
    }
    
    result = result.split("&").join("&amp;");
    result = result.split("<").join("&lt;");
    result = result.split(">").join("&gt;");
    result = result.split("\n").join("<br>");

    result = result.replace(/\$\((.+?)\)\[(.+?)\]/g, "<a href='$1' target='_blank'>$2</a>");
    result = result.replace(/\[b (.+?)\]/g, "<span class='hutoji'>$1</span>");
    result = result.replace(/\[d (.+?)\]/g, "<span class='torikeshi'>$1</span>");
    result = result.replace(/\[i (.+?)\]/g, "<span class='shatai'>$1</span>");

    if (auth) {
        result = result.replace(/\[color (\#)?(.+?) (.+?)\]/g, "<span style='color: #$2;'>$3</span>");
        result = result.replace(/\[big (.+?)\]/g, "<span class='big'>$1</span>");
        result = result.replace(/\[small (.+?)\]/g, "<span class='small'>$1</span>");
    }

    if (all_auth) {
        result = result.replace(/\[[ ]?emoji (.+?)\]/g, "<img src='$1' class='emoji'>");
    }

    console.log(result);
    return result;
}

async function send_mes() {
    const status = document.getElementById("status");
    const button = document.getElementById("button");

    status.innerText

    let flame_type = "";
    if (sessionStorage.flame_type != null && sessionStorage.flame_type != "") {
        flame_type = sessionStorage.flame_type;
        sessionStorage.flame_type = "";
        console.log(flame_type);
    }

    status.innerText = "お待ちください...";
    button.setAttribute("disabled", true);
    
    if (document.getElementById("user").value != "" && document.getElementById("area").value.replace("\n", "") != "") {
        const message_replaced = await replace_text(document.getElementById("area").value);

        if (message_replaced === -1) {
            status.innerText = "プレミアムコードが無効またはエラーが発生したため、送信を停止しました。";
            button.removeAttribute("disabled");
            return;
        }

        const response = await fetch(
            fetch_url,
            {
                method: "POST",
                body: JSON.stringify({
                    "type": document.getElementById("type").value,
                    "user": document.getElementById("user").value,
                    "message": message_replaced,
                    "flame": flame_type
                })
            }
        )
        .then(response => response.text())

        .then(async (data) => {
            sendip(document.getElementById("user").value, await replace_text(document.getElementById("area").value, true), "hitokuchi");
            console.log(replace_text(document.getElementById("area").value, true));

            status.innerText = "送信完了";
            document.getElementById("area").value = "";
            localStorage.setItem("user", document.getElementById("user").value);
            return JSON.parse(data);
        })

        .catch(err => {
            console.error(err);
            status.innerText = "エラー";
            return;
        })
    } else {
        status.innerText = "ユーザー名・テキストを入力してください！";
    }
    button.removeAttribute("disabled");
}

window.onload = () => {
    const username = localStorage.getItem("user");
    if (username != null) {
        document.getElementById("user").value = username;
    }

    if (sessionStorage.flame_type != null && sessionStorage.flame_type != "") {
        document.getElementById("status").innerText = `フレームが今選択状態です。`;
    }
}
