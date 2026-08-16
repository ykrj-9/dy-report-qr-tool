/*
Vercel Serverless Function

用途：
v.douyin.com 短網址
→ 跟隨 redirect
→ 從最終 URL / HTML 抓影片 ID
*/

const ID_PATTERNS = [

  /\/video\/(\d{10,})/,

  /[?&](?:modal_id|aweme_id|item_id|group_id|object_id)=(\d{10,})/,

  /\b(\d{16,22})\b/

];


function extractVideoID(text) {

  if (!text) {
    return null;
  }


  for (const pattern of ID_PATTERNS) {

    const match =
      text.match(pattern);


    if (match) {
      return match[1];
    }

  }


  return null;

}


export async function GET(request) {

  try {

    const requestURL =
      new URL(request.url);


    const url =
      requestURL
      .searchParams
      .get("url");


    if (!url) {

      return Response.json(

        {
          ok: false,
          error: "缺少 url"
        },

        {
          status: 400
        }

      );

    }



    let parsed;


    try {

      parsed =
        new URL(url);

    }

    catch {

      return Response.json(

        {
          ok: false,
          error: "網址格式錯誤"
        },

        {
          status: 400
        }

      );

    }



    /*
    只允許 Douyin 網域，
    避免 API 被拿去做代理任意網址。
    */

    const hostname =
      parsed.hostname
      .toLowerCase();


    if (
      hostname !==
        "v.douyin.com" &&

      hostname !==
        "www.douyin.com" &&

      hostname !==
        "douyin.com"
    ) {

      return Response.json(

        {
          ok: false,
          error: "只支援 Douyin 網址"
        },

        {
          status: 400
        }

      );

    }



    /*
    fetch 預設會跟隨 redirect
    */

    const response =
      await fetch(
        url,
        {
          redirect: "follow",

          headers: {

            "User-Agent":
              "Mozilla/5.0 " +
              "(Windows NT 10.0; Win64; x64) " +
              "AppleWebKit/537.36 " +
              "(KHTML, like Gecko) " +
              "Chrome/151.0.0.0 Safari/537.36",

            "Accept-Language":
              "zh-CN,zh;q=0.9,en;q=0.8"

          }
        }
      );



    const finalURL =
      response.url;


    /*
    第一優先：
    從 redirect 後網址找 ID
    */

    let videoID =
      extractVideoID(
        finalURL
      );



    /*
    如果網址沒 ID，
    再讀 HTML
    */

    let html = "";


    if (!videoID) {

      html =
        await response.text();


      videoID =
        extractVideoID(
          html
        );

    }



    if (!videoID) {

      return Response.json(

        {
          ok: false,

          error:
            "有成功開啟短網址，但沒有找到影片 ID。",

          final_url:
            finalURL
        },

        {
          status: 422
        }

      );

    }



    return Response.json({

      ok: true,

      video_id:
        videoID,

      final_url:
        finalURL

    });

  }


  catch (error) {

    console.error(error);


    return Response.json(

      {
        ok: false,

        error:
          "解析失敗：" +
          error.message
      },

      {
        status: 500
      }

    );

  }

}
