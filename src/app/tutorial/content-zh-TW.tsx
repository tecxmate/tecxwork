import { EVENT_CONFIG } from "@/lib/data";

export const tutorialUiZh = {
  pageTitle: "平台教學",
  pageSubtitle: (admin: boolean) =>
    admin
      ? "適用於學生、招募人員與管理員的 TECXWORK 使用指南。"
      : "適用於學生與招募人員的 TECXWORK 使用指南。",
  studentTab: "學生指南",
  recruiterTab: "招募人員指南",
  adminTab: "管理員指南",
};

export function StudentSectionZh() {
  return (
    <section id="student-guide" className="scroll-mt-8">
      <h2 className="text-2xl font-bold border-b pb-2 mb-6">學生指南</h2>
      <div className="space-y-6 text-sm leading-relaxed">
        <div>
          <h3 className="text-xl font-semibold mb-2">概覽</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>瀏覽</strong>參與企業及其開放職缺</li>
            <li><strong>申請</strong>於指定時段面試 — 招募人員會審核您的履歷並確認</li>
            <li><strong>管理</strong>您的個人資料(技能、學校、工作經驗、證照、履歷、照片)</li>
            <li>當招募人員接受、拒絕或加入候補時,<strong>透過站內與電子郵件接收通知</strong></li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">開始使用</h3>

          <h4 className="font-semibold mt-4 mb-2">1. 驗證電子郵件</h4>
          <ol className="list-decimal pl-5 space-y-1 mb-4">
            <li>前往 TECXWORK 網站</li>
            <li>點選 <strong>「開始使用」</strong> → <strong>「我是學生」</strong> → <strong>「註冊」</strong></li>
            <li>輸入電子郵件 — 我們會寄送 6 位數驗證碼(10 分鐘內有效)</li>
            <li>輸入驗證碼以確認您擁有該電子郵件帳號</li>
          </ol>
          <div className="bg-muted p-3 rounded-md text-muted-foreground border-l-4 border-primary mb-4">
            沒收到驗證碼?請檢查垃圾信件,或點選 <em>重新寄送</em>。每小時最多可索取 5 次。
          </div>

          <h4 className="font-semibold mt-4 mb-2">2. 完成個人資料</h4>
          <p className="mb-2">驗證電子郵件後,請填寫個人資料。表單會自動儲存於瀏覽器,中斷後可繼續。必填欄位依管理員設定的活動模式而定:</p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li><strong>必填</strong>:全名、密碼(8 字元以上)、履歷連結(Google Drive)、PIPA 同意</li>
            <li><strong>「完整」模式必填</strong>:學校(支援台灣學校自動完成)、科系、就讀層級、預計畢業時間</li>
            <li><strong>建議填寫</strong>:電話、國籍、就讀年級、求職狀態、工作許可、技能、偏好城市、偏好產業、LinkedIn / 作品集連結、工作經驗、證照、簡介、頭像</li>
          </ul>
          <div className="bg-muted p-3 rounded-md text-muted-foreground border-l-4 border-primary mb-4">
            <strong>提示:</strong>完整的個人資料在招募人員搜尋中排序更靠前,也更容易獲得邀請。
          </div>

          <h4 className="font-semibold mt-4 mb-2">3. 登入完成</h4>
          <p>送出後您會自動登入,並被導向<strong>企業目錄</strong>(瀏覽頁)。</p>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">瀏覽與申請</h3>

          <h4 className="font-semibold mt-4 mb-2">尋找企業與職缺</h4>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li><strong>企業</strong> — 已註冊活動的招募人員與其開放職缺</li>
            <li>搜尋列可依公司、職位或職缺名稱篩選</li>
            <li>產業篩選晶片可縮小企業列表</li>
          </ul>

          <h4 className="font-semibold mt-4 mb-2">申請面試</h4>
          <ol className="list-decimal pl-5 space-y-1 mb-4">
            <li>開啟招募人員頁面,閱讀公司介紹、照片與職缺</li>
            <li>選擇您感興趣的職缺</li>
            <li>使用日期箭頭找到活動日({EVENT_CONFIG.displayDate}),挑選可用時段</li>
            <li>確認履歷連結正確(此次申請可覆寫)</li>
            <li>勾選 PIPA 同意並點選 <strong>申請</strong></li>
          </ol>
          <div className="bg-muted p-3 rounded-md text-muted-foreground border-l-4 border-primary mb-4">
            申請<em>不會</em>立即保留時段。招募人員須先審核履歷並點選「接受」 — 屆時會原子地鎖定面試官時段,雙方都會收到確認郵件。
          </div>

          <h4 className="font-semibold mt-4 mb-2">申請後</h4>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>狀態最初為<strong>待審核</strong>。招募人員會在後台看到。</li>
            <li>當招募人員處理時,您會收到站內通知(鈴鐺圖示)與電子郵件:
              <ul className="list-disc pl-5 mt-1">
                <li><strong>接受</strong> — 面試已確認;將 Google Drive 履歷分享給對方郵件</li>
                <li><strong>候補</strong> — 時段已滿,但若有空缺仍可能受邀</li>
                <li><strong>拒絕</strong> — 對方未錄取;郵件可能含個人化訊息</li>
              </ul>
            </li>
            <li>可在預約頁取消任何待審或已接受的申請 — 釋出時段給其他人</li>
          </ul>
          <div className="bg-muted p-3 rounded-md text-muted-foreground border-l-4 border-primary mb-4">
            <strong>重要:</strong>被接受後,只能將 Google Drive 履歷<em>分享給</em>確認信中顯示的招募人員郵件。請勿將連結設為「擁有連結的任何人」。
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">您的個人資料</h3>
          <p className="mb-2">隨時從選單開啟<strong>個人資料</strong>。可編輯:</p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>姓名、電話、國籍、照片</li>
            <li>學校、科系、就讀層級/年級、畢業日期</li>
            <li>求職狀態、工作許可</li>
            <li>技能、偏好地點、偏好產業</li>
            <li>工作經驗(最多 5 筆)與證照(最多 10 筆)</li>
            <li>履歷連結、LinkedIn、作品集</li>
            <li>簡介 / 自我介紹</li>
          </ul>
          <p>變更會立即儲存。招募人員下次開啟您的資料時會看到最新版本。</p>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">忘記密碼</h3>
          <ol className="list-decimal pl-5 space-y-1 mb-4">
            <li>於登入頁點選 <strong>忘記密碼?</strong></li>
            <li>輸入電子郵件 — 您會收到 6 位數重設驗證碼(10 分鐘內有效)</li>
            <li>輸入驗證碼後設定新密碼(8 字元以上)</li>
          </ol>
          <p>重設連結為一次性使用,完成流程後即失效。</p>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">常見問題</h3>
          <div className="space-y-3">
            <div>
              <p className="font-semibold">問:可以申請多家公司嗎?</p>
              <p>答:可以。同一公司也可以申請多個<em>不同</em>職缺 — 但同一職缺不能重複申請。</p>
            </div>
            <div>
              <p className="font-semibold">問:兩個面試可以時間重疊嗎?</p>
              <p>答:不行。系統會阻擋與您已預約時段衝突的待審或已接受面試。</p>
            </div>
            <div>
              <p className="font-semibold">問:招募人員拒絕了我 — 可以再申請嗎?</p>
              <p>答:可以,可申請同公司其他職缺,或其他公司。</p>
            </div>
            <div>
              <p className="font-semibold">問:可以更改電子郵件嗎?</p>
              <p>答:無法直接修改 — 變更電子郵件需管理員協助以維持資料一致。</p>
            </div>
            <div>
              <p className="font-semibold">問:目前是英 / 中 / 越語介面 — 可以切換嗎?</p>
              <p>答:可以。語言切換選項在選單中。</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function RecruiterSectionZh() {
  return (
    <section id="recruiter-guide" className="scroll-mt-8">
      <h2 className="text-2xl font-bold border-b pb-2 mb-6">招募人員指南</h2>
      <div className="space-y-6 text-sm leading-relaxed">
        <div>
          <h3 className="text-xl font-semibold mb-2">概覽</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>張貼職缺</strong>並提供完整資訊(薪資、雇用型態、簽證支援、截止日)— 上線前由管理員審核</li>
            <li>為每個職缺<strong>接收學生申請</strong></li>
            <li><strong>接受、候補或拒絕</strong>申請 — 接受時會原子地鎖定面試官時段</li>
            <li>當管理員啟用該模式時,可<strong>瀏覽學生履歷</strong>並直接預約優秀人選</li>
            <li><strong>編輯公司資料</strong> — 介紹、照片、相簿、面試官人數、聯絡資訊</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">開始使用</h3>

          <h4 className="font-semibold mt-4 mb-2">1. 取得帳號核准</h4>
          <p className="mb-2">註冊前,活動管理員必須白名單以下之一:</p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>您的<strong>電子郵件網域</strong>(例:<code>tsmc.com</code>) — 該網域內任何人皆可註冊</li>
            <li>您的<strong>特定電子郵件</strong>(例:<code>jane@gmail.com</code>) — 僅此地址可註冊</li>
          </ul>
          <div className="bg-muted p-3 rounded-md text-muted-foreground border-l-4 border-primary mb-4">
            若註冊顯示「此電子郵件網域未授權」,請聯絡活動管理員,提供您將使用的電子郵件。
          </div>

          <h4 className="font-semibold mt-4 mb-2">2. 建立帳號</h4>
          <ol className="list-decimal pl-5 space-y-1 mb-4">
            <li>點選 <strong>「開始使用」</strong> → <strong>「我是招募人員」</strong> → <strong>「註冊」</strong></li>
            <li>輸入您的工作信箱 — 系統會檢查白名單 / 核准清單</li>
            <li>填寫:姓名、密碼(8 字元以上)、公司名稱、產業、聯絡信箱、簡介</li>
            <li>確認三項招募聲明(合法雇用、不歧視、工作許可查核)</li>
            <li>點選 <strong>建立帳號</strong></li>
          </ol>
          <div className="bg-muted p-3 rounded-md text-muted-foreground border-l-4 border-primary mb-4">
            已有帳號?請改用 <strong>登入</strong> — 註冊表單會拒絕重建已存在的帳號。忘記密碼?使用密碼重設流程。
          </div>

          <h4 className="font-semibold mt-4 mb-2">3. 登入完成</h4>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>系統會依設定的時段範圍與長度,為活動日({EVENT_CONFIG.displayDate})預先產生面試時段</li>
            <li>預設面試官數為 1 — 若有多位面試官並行,請至後台調整</li>
            <li>您將被導向 <strong>後台 → 面試</strong></li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">張貼職缺</h3>
          <ol className="list-decimal pl-5 space-y-1 mb-4">
            <li>開啟 <strong>後台 → 職缺</strong> 並點選 <strong>新增職缺</strong></li>
            <li>填寫:職稱、地點、雇用型態、工作型態、職級、薪資範圍與幣別、語言要求、簽證支援、申請截止日、職缺說明、職責、條件、福利,以及選用的 JD 連結</li>
            <li>可隨時存為草稿</li>
            <li>準備好後,點選 <strong>送出審核</strong></li>
          </ol>
          <p className="mb-2">管理員會依禁用詞清單(例如歧視性用語)審核內容。審核後:</p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li><strong>核准</strong> → 職缺顯示於您的公開頁</li>
            <li><strong>退回</strong> → 顯示管理員備註,請修改後重新送出</li>
            <li>已核准職缺一經編輯會回到草稿,需要重新審核</li>
          </ul>
          <div className="bg-muted p-3 rounded-md text-muted-foreground border-l-4 border-primary mb-4">
            管理員可以完全停用審核 — 此時職缺一存檔即自動上線。
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">審核申請</h3>
          <p className="mb-2">當學生申請時,後台會出現 <strong>待審核</strong> 項目,內容包含:</p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>申請人姓名、信箱、申請時段、職位</li>
            <li>履歷連結(僅接受已驗證的 <code>https://</code> — 可安全點開)</li>
            <li>站內通知 + 行動裝置推播通知(若已啟用)</li>
          </ul>
          <p className="mb-2">三種操作:</p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li><strong>接受</strong> — 系統會在所要求時段中,原子地鎖定一個面試官時段。雙方都會收到確認信,面試正式成立。每位申請人於同一時段僅可被接受一次。</li>
            <li><strong>候補</strong> — 通知申請人時段已滿,但仍可能受邀。若您取消同時段已接受面試,下一位候補申請人會自動轉為待審核。</li>
            <li><strong>拒絕</strong> — 可附上簡短訊息(已過濾),會包含於郵件中。</li>
          </ul>
          <div className="bg-destructive/10 p-3 rounded-md text-destructive border-l-4 border-destructive mb-4">
            <strong>注意:</strong>接受/取消為即時操作。若同公司兩位招募人員同時審核同一申請,系統會序列化 — 僅一位接受成功,其他人會看到「已被接受」。
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">瀏覽與預約申請人</h3>
          <p className="mb-4">當管理員將活動模式設為<em>招募人員預約申請人</em>或<em>雙向</em>時可使用。</p>
          <ol className="list-decimal pl-5 space-y-1 mb-4">
            <li>開啟 <strong>後台 → 申請人</strong></li>
            <li>依姓名、科系或技能搜尋;點選任一卡片查看完整資料</li>
            <li>選擇申請人的可預約時段</li>
            <li>點選 <strong>預約此時段</strong> — 原子地鎖定其可用時段與您的面試官時段</li>
          </ol>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">編輯公司資料</h3>
          <p className="mb-2">於後台開啟公司資料編輯器,可變更:</p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>公司介紹、網站</li>
            <li>Logo 與相簿照片(最多 4 張 — 上傳至 Vercel Blob)</li>
            <li>面試官人數(1–10) — 增加會擴大時段池;減少僅會移除尚未預約的時段</li>
            <li>顯示給申請人的聯絡信箱</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">通知</h3>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>鈴鐺圖示顯示新申請、取消與候補轉正</li>
            <li>於鈴鐺選單啟用網頁推播,即使分頁關閉也能收到提醒</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">常見問題</h3>
          <div className="space-y-3">
            <div>
              <p className="font-semibold">問:同一公司多位招募人員可同時註冊嗎?</p>
              <p>答:可以。每位都有獨立帳號、後台與面試官時段池。</p>
            </div>
            <div>
              <p className="font-semibold">問:面試官時段如何產生?</p>
              <p>答:預設面試官數為 1 — 即每時段一個。若調為 N,則每時段會有 N 個並行時段,可同時面試最多 N 位申請人。</p>
            </div>
            <div>
              <p className="font-semibold">問:預先核准的信箱在我註冊後就無法使用了。</p>
              <p>答:正確。預先核准在註冊時消耗,之後僅需正常登入即可。</p>
            </div>
            <div>
              <p className="font-semibold">問:我編輯了已核准的職缺,為何回到草稿?</p>
              <p>答:任何內容變更都會重新送審,以避免核准後繞過審查。</p>
            </div>
            <div>
              <p className="font-semibold">問:活動結束後資料會如何處理?</p>
              <p>答:管理員會匯出所有預約與個人資料,於 2 天內永久刪除以符合台灣 PIPA。</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function AdminSectionZh() {
  return (
    <section id="admin-guide" className="scroll-mt-8">
      <h2 className="text-2xl font-bold border-b pb-2 mb-6">管理員指南</h2>
      <div className="space-y-6 text-sm leading-relaxed">
        <div>
          <h3 className="text-xl font-semibold mb-2">概覽</h3>
          <p className="mb-2">作為活動管理員,您完整掌控平台:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>招募人員存取</strong> — 網域白名單與個別電子郵件預核准</li>
            <li><strong>活動模式與鎖定</strong> — 控制預約方向並於活動期間凍結</li>
            <li><strong>職缺審核</strong> — 審查與核准/退回每筆招募人員張貼的職缺</li>
            <li><strong>用戶管理</strong> — 檢視、搜尋、排序、移除學生與招募人員</li>
            <li><strong>預約</strong> — 檢視所有預約;匯出 CSV</li>
            <li><strong>提醒信</strong> — 活動前批次寄送行程給學生與招募人員</li>
            <li><strong>首頁圖片</strong> — 管理首頁顯示的主視覺圖片</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">登入</h3>
          <p className="mb-2">管理員帳號直接於資料庫建置 — 沒有管理員註冊流程。透過一般登入頁登入後,角色檢查會將您導向 <code>/admin</code>。</p>
          <div className="bg-destructive/10 p-3 rounded-md text-destructive border-l-4 border-destructive mb-4">
            <strong>重要:</strong>於對招募人員與學生開放平台前,請更換管理員密碼。可使用標準的<em>忘記密碼</em>流程或更新 seed。
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">後台區塊</h3>

          <h4 className="font-semibold mt-4 mb-2">1. 統計</h4>
          <p className="mb-2">即時顯示招募人員、學生、總時段、可用時段與預約數,實時更新。</p>

          <h4 className="font-semibold mt-4 mb-2">2. 活動模式與註冊</h4>
          <div className="overflow-x-auto mb-4">
            <table className="min-w-full text-left border">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-2 border-b">設定</th>
                  <th className="px-4 py-2 border-b">控制內容</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2 border-b font-medium">模式:申請人預約招募人員</td>
                  <td className="px-4 py-2 border-b">學生於指定時段申請職缺;招募人員接受</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border-b font-medium">模式:招募人員預約申請人</td>
                  <td className="px-4 py-2 border-b">招募人員搜尋履歷,直接預約學生的可用時段</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border-b font-medium">模式:雙向</td>
                  <td className="px-4 py-2 border-b">兩種流程同時啟用</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border-b font-medium">模式鎖定</td>
                  <td className="px-4 py-2 border-b">凍結模式,避免活動期間誤改</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border-b font-medium">註冊模式(完整 / 精簡)</td>
                  <td className="px-4 py-2 border-b">學生註冊時是否須填寫學校+科系+就讀層級,或僅最低必要</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border-b font-medium">職缺審核</td>
                  <td className="px-4 py-2 border-b">開啟時,招募人員的每筆職缺都需經您核准才會公開</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="bg-muted p-3 rounded-md text-muted-foreground border-l-4 border-primary mb-4">
            <strong>提示:</strong>活動開放前至少 1 小時鎖定模式。
          </div>

          <h4 className="font-semibold mt-4 mb-2">3. 招募人員存取</h4>
          <p className="mb-2">兩個互補工具:</p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li><strong>允許網域</strong> — 該網域(例:<code>tsmc.com</code>)的任何人皆可自行註冊。自動填入公司與產業。</li>
            <li><strong>電子郵件核准</strong> — 預先核准特定信箱(適用於使用個人信箱的單一招募人員),並預填您指定的公司與產業。</li>
          </ul>
          <p>移除任一項目<strong>不會</strong>登出已存在的招募人員,只影響後續註冊。</p>

          <h4 className="font-semibold mt-4 mb-2">4. 職缺審核</h4>
          <p className="mb-2">當審核啟用時,招募人員送出的職缺會進入佇列:</p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li><strong>核准</strong> → 職缺於招募人員頁公開</li>
            <li><strong>退回</strong> → 顯示備註給招募人員,以便修正後重送</li>
            <li><strong>重置為草稿</strong> → 不做決定,退回給招募人員</li>
          </ul>
          <p>系統也會於送出時自動標記疑似歧視性字眼 — 但仍應由人員最終把關。</p>

          <h4 className="font-semibold mt-4 mb-2">5. 用戶</h4>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>招募人員與學生各有分頁</li>
            <li>欄位可排序,搜尋為即時篩選</li>
            <li>移除使用者會於<em>單一交易</em>內刪除帳號、個人資料、時段與預約 — 無孤立資料</li>
          </ul>
          <div className="bg-destructive/10 p-3 rounded-md text-destructive border-l-4 border-destructive mb-4">
            <strong>警告:</strong>刪除無法還原。若日後可能需要,請先以 CSV 匯出工具備份。
          </div>

          <h4 className="font-semibold mt-4 mb-2">6. 預約與匯出</h4>
          <p>預約面板顯示所有招募人員的所有面試,並有狀態篩選。點選 <strong>匯出 CSV</strong> 可下載含申請人、招募人員、時間、狀態與履歷連結的檔案 — 數值已預先轉義以防試算表公式注入。</p>

          <h4 className="font-semibold mt-4 mb-2">7. 提醒信</h4>
          <p>一鍵將活動前的面試行程提醒寄給所有學生或所有招募人員。每筆寄送都會記錄成功/失敗 — 於 email-stats 面板查看送達狀況。</p>

          <h4 className="font-semibold mt-4 mb-2">8. 首頁圖片與時段</h4>
          <p className="mb-2">管理首頁主視覺圖片(URL 會依 Vercel Blob 主機白名單驗證),並於變動時調整活動時段 / 顯示日期。</p>
          <ul className="list-disc pl-5 space-y-1 mb-2">
            <li>上傳的圖片會成為首頁 <strong>主視覺輪播</strong> 的投影片:活動資訊(標題、倒數計時、CTA)為第 1 張,之後依序顯示每張上傳的照片。</li>
            <li>輪播在主視覺停留 8 秒、每張照片停留 5 秒,接著循環回到主視覺。訪客可滑動、點選圓點,或滑鼠/觸控暫停。</li>
            <li>上傳 <strong>0 張</strong> → 不啟用輪播,僅顯示靜態主視覺。<strong>1 張以上</strong> → 啟用輪播。最多支援 4 張。</li>
            <li>同樣的圖片也會顯示在首頁下方的「活動精選」相簿。</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">活動前檢查表</h3>

          <h4 className="font-semibold mt-4 mb-2">2 週前</h4>
          <ul className="list-none pl-0 space-y-1 mb-4">
            <li><input type="checkbox" readOnly className="mr-2" /> 加入所有招募人員的電子郵件網域與個別核准</li>
            <li><input type="checkbox" readOnly className="mr-2" /> 決定註冊模式(完整/精簡)與活動模式</li>
            <li><input type="checkbox" readOnly className="mr-2" /> 將平台網址分享給學校與參與企業</li>
            <li><input type="checkbox" readOnly className="mr-2" /> 確認 Resend / 推播環境變數已於 production 設定</li>
          </ul>

          <h4 className="font-semibold mt-4 mb-2">1 週前</h4>
          <ul className="list-none pl-0 space-y-1 mb-4">
            <li><input type="checkbox" readOnly className="mr-2" /> 確認招募人員註冊符合預期;追蹤未到的公司</li>
            <li><input type="checkbox" readOnly className="mr-2" /> 審核並核准審核佇列中所有送出的職缺</li>
            <li><input type="checkbox" readOnly className="mr-2" /> 端對端測試一次申請(申請 → 接受 → 收到信)</li>
          </ul>

          <h4 className="font-semibold mt-4 mb-2">1 天前</h4>
          <ul className="list-none pl-0 space-y-1 mb-4">
            <li><input type="checkbox" readOnly className="mr-2" /> 寄送活動前提醒信給學生與招募人員</li>
            <li><input type="checkbox" readOnly className="mr-2" /> <strong>鎖定活動模式</strong></li>
            <li><input type="checkbox" readOnly className="mr-2" /> 檢查所有統計;匯出基準 CSV</li>
          </ul>

          <h4 className="font-semibold mt-4 mb-2">活動當日</h4>
          <ul className="list-none pl-0 space-y-1 mb-4">
            <li><input type="checkbox" readOnly className="mr-2" /> 持續關注後台;透過所選管道回應支援需求</li>
            <li><input type="checkbox" readOnly className="mr-2" /> 若有人反映通知遺失,抽查招募人員信箱</li>
          </ul>

          <h4 className="font-semibold mt-4 mb-2">活動後 2 天</h4>
          <ul className="list-none pl-0 space-y-1 mb-4">
            <li><input type="checkbox" readOnly className="mr-2" /> 最終匯出所有預約 CSV</li>
            <li><input type="checkbox" readOnly className="mr-2" /> 依 PIPA 刪除使用者資料(管理員「用戶」→ 全部移除)</li>
            <li><input type="checkbox" readOnly className="mr-2" /> 通知招募人員資料已清除</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">疑難排解</h3>
          <div className="space-y-4">
            <div>
              <p className="font-semibold">「招募人員說無法註冊」</p>
              <p>→ 檢查允許網域與電子郵件核准清單,加入缺漏項目。請對方使用相同信箱重試。</p>
            </div>
            <div>
              <p className="font-semibold">「學生說沒收到驗證碼」</p>
              <p>→ 檢視 Email Stats 面板 — 可能 Resend 速率受限或地址退信。每小時最多可索取 5 次。請確認信件未進垃圾匣。</p>
            </div>
            <div>
              <p className="font-semibold">「兩位學生在同一時段看到『接受失敗』」</p>
              <p>→ 這是時段鎖定正確運作的結果:每時段僅一個接受成功。另一位招募人員/申請人請改選其他時段。</p>
            </div>
            <div>
              <p className="font-semibold">「已核准的職缺沒有出現」</p>
              <p>→ 招募人員可能於核准後再次編輯,使其回到草稿。請重新審核佇列。</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">技術備註</h3>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li><strong>技術堆疊</strong>:Vercel 上的 Next.js 16;Neon Postgres(serverless WebSocket 驅動)搭配 Drizzle ORM</li>
            <li><strong>驗證</strong>:JWT cookie、bcrypt 12 回合雜湊、密碼最少 8 字元</li>
            <li><strong>輸入驗證</strong>:在 auth、註冊與預約端點以 zod 驗證</li>
            <li><strong>並發</strong>:Postgres advisory lock + 原子 CAS 風格 UPDATE 確保不會重複預約;由整合測試覆蓋(<code>npm test</code>)</li>
            <li><strong>速率限制</strong>:Vercel Runtime Cache(一般 API 60/分鐘,auth 端點 5/分鐘)</li>
            <li><strong>電子郵件</strong>:Resend,並對使用者輸入欄位進行 HTML 轉義與 URL 白名單</li>
            <li><strong>推播</strong>:透過 VAPID 金鑰的 Web Push</li>
            <li><strong>儲存</strong>:Vercel Blob 用於頭像、Logo、相簿與首頁圖片</li>
            <li><strong>I18n</strong>:en、zh-TW、vi</li>
            <li><strong>設計與開發</strong>:<a href="https://tecxmate.com" className="text-primary hover:underline">TECXMATE.COM</a></li>
          </ul>
        </div>
      </div>
    </section>
  );
}
