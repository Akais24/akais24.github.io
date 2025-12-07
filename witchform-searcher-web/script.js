document.getElementById('searchForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const formTitle = document.getElementById('formTitle').value;
    const productKeyword = document.getElementById('productKeyword').value;

    console.log('폼 제목 키워드:', formTitle);
    console.log('상품 키워드:', productKeyword);

    // 여기에 검색 로직을 추가할 예정
    alert(`검색 시작!\n폼 제목: ${formTitle}\n상품: ${productKeyword}`);
});
