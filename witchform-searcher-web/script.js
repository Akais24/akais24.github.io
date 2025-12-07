// API 호출을 위한 URL 생성
function buildURL(baseURL, params) {
    const url = new URL(baseURL);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    return url.toString();
}

// Witchform API 검색
async function searchForms(keyword) {
    const forms = [];
    const titleMap = new Set();

    try {
        let page = 1;
        let totalPage = 1;

        while (page <= totalPage) {
            const url = buildURL('https://witchform.com/api/search/select-search.php', {
                keyword: keyword,
                tap: 'form',
                page: page.toString(),
                safe: 'off',
                onsale: 'off',
                remain: 'off',
                order: 'pop'
            });

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            totalPage = result.total_page;

            for (const item of result.data) {
                const title = item.formTitle;

                // 중복 제목 제거
                if (titleMap.has(title)) {
                    continue;
                }
                titleMap.add(title);

                forms.push({
                    title: item.formTitle,
                    formType: item.formType,
                    formUuid: item.formUuid,
                    formIdx: item.formIdx
                });
            }

            page++;
        }

        return forms;
    } catch (error) {
        console.error('검색 중 오류 발생:', error);
        throw error;
    }
}

// 폼 제출 이벤트
document.getElementById('searchForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const formTitle = document.getElementById('formTitle').value;
    const productKeyword = document.getElementById('productKeyword').value;

    console.log('폼 제목 키워드:', formTitle);
    console.log('상품 키워드:', productKeyword);

    const resultsSection = document.getElementById('resultsSection');
    const resultsContent = document.getElementById('resultsContent');

    // 로딩 표시
    resultsSection.style.display = 'block';
    resultsContent.innerHTML = '<div class="loading">검색 중...</div>';

    try {
        // 검색 시작
        const forms = await searchForms(formTitle);
        console.log('검색 결과:', forms);

        // 결과 표시
        if (forms.length === 0) {
            resultsContent.innerHTML = '<div class="loading">검색 결과가 없습니다.</div>';
        } else {
            resultsContent.innerHTML = forms.map(form => `
                <div class="form-item">
                    <h3>${form.title}</h3>
                    <p>타입: ${form.formType}</p>
                    <p>UUID: ${form.formUuid}</p>
                    <p>Index: ${form.formIdx}</p>
                </div>
            `).join('');
        }

        // TODO: 각 폼에서 상품 검색 로직 추가
    } catch (error) {
        resultsContent.innerHTML = `<div class="loading">오류: ${error.message}</div>`;
        console.error('검색 중 오류:', error);
    }
});
