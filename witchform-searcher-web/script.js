// API 호출을 위한 URL 생성
function buildURL(baseURL, params) {
    const url = new URL(baseURL);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    return url.toString();
}

// 폼 URL 생성
function getFormURL(form) {
    switch (form.formType) {
        case 'payform':
            return buildURL('https://witchform.com/formViewer/payform.php', {
                uuid: form.formUuid
            });
        case 'deposit':
            return buildURL('https://witchform.com/formViewer/slim.php', {
                idx: form.formIdx.toString()
            });
        default:
            throw new Error(`Unknown form type: ${form.formType}`);
    }
}

// 폼에서 상품 조회
async function fetchProducts(form) {
    try {
        const url = getFormURL(form);
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const html = await response.text();
        const products = [];
        const productSet = new Set();

        // 정규식으로 상품명과 가격 추출
        const nameRegex = /<div class="name">(.*?)<\/div>/g;
        const priceRegex = /<div class="price">(.*?)<\/div>/;

        let nameMatch;
        while ((nameMatch = nameRegex.exec(html)) !== null) {
            const name = nameMatch[1];
            const afterName = html.substring(nameMatch.index + nameMatch[0].length);
            const priceMatch = priceRegex.exec(afterName);

            if (priceMatch) {
                const price = priceMatch[1];
                const product = `${name} (${price})`;

                if (!productSet.has(product)) {
                    productSet.add(product);
                    products.push({
                        name: name,
                        price: price,
                        full: product
                    });
                }
            }
        }

        return products;
    } catch (error) {
        console.error(`폼 ${form.title}에서 상품 조회 실패:`, error);
        return [];
    }
}

// 상품 필터링
function filterProducts(products, keyword) {
    return products.filter(product =>
        product.name.includes(keyword) || product.full.includes(keyword)
    );
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
        // 1단계: 폼 검색
        resultsContent.innerHTML = '<div class="loading">폼 검색 중...</div>';
        const forms = await searchForms(formTitle);
        console.log('검색된 폼:', forms);

        if (forms.length === 0) {
            resultsContent.innerHTML = '<div class="loading">검색 결과가 없습니다.</div>';
            return;
        }

        // 2단계: 각 폼에서 상품 조회 및 필터링 (5개씩 병렬 처리)
        resultsContent.innerHTML = '<div class="loading">상품 조회 중...</div>';
        const results = [];
        const batchSize = 5;

        for (let i = 0; i < forms.length; i += batchSize) {
            const batch = forms.slice(i, i + batchSize);

            // 배치 내에서 병렬로 상품 조회
            const batchResults = await Promise.all(
                batch.map(async (form) => {
                    const products = await fetchProducts(form);
                    const filteredProducts = filterProducts(products, productKeyword);

                    if (filteredProducts.length > 0) {
                        return {
                            form: form,
                            products: filteredProducts
                        };
                    }
                    return null;
                })
            );

            // null이 아닌 결과만 추가
            results.push(...batchResults.filter(r => r !== null));

            // 진행상황 표시
            resultsContent.innerHTML = `<div class="loading">상품 조회 중... (${Math.min(i + batchSize, forms.length)}/${forms.length})</div>`;
        }

        // 3단계: 결과 표시
        if (results.length === 0) {
            resultsContent.innerHTML = '<div class="loading">검색된 상품이 없습니다.</div>';
        } else {
            resultsContent.innerHTML = results.map(result => `
                <div class="form-item">
                    <h3>${result.form.title}</h3>
                    <p class="form-meta">타입: ${result.form.formType}</p>
                    <div class="products-list">
                        <h4>검색된 상품 (${result.products.length}개)</h4>
                        ${result.products.map(product => `
                            <div class="product-item">
                                <span class="product-name">${product.name}</span>
                                <span class="product-price">${product.price}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('');
        }

        console.log('최종 결과:', results);
    } catch (error) {
        resultsContent.innerHTML = `<div class="loading">오류: ${error.message}</div>`;
        console.error('검색 중 오류:', error);
    }
});
