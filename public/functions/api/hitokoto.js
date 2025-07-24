export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const params = url.searchParams;
  
  try {
    // 解析请求参数
    const encodeType = params.get('encode') || 'json';
    const minLength = parseInt(params.get('min_length') || '0');
    const maxLength = parseInt(params.get('max_length') || '999');
    const categoriesParam = params.getAll('c').length 
      ? params.getAll('c').filter(c => c.length === 1) 
      : Object.keys(context.env.INDEX.categories);
    
    // 加载索引数据
    const index = context.env.INDEX;
    if (typeof index !== 'object' || 
        !index.categories || 
        !index.sentences ||
        Object.keys(index.sentences).length === 0) {
      
      return new Response(JSON.stringify({
        status: 500,
        message: "服务器错误: 索引数据无效，请检查INDEX环境变量",
        data: [],
        ts: Date.now()
      }), { status: 500 });
    }
    
    // 获取所有符合条件的句子ID
    const candidateIds = Object.keys(index.sentences).filter(id => {
      const sentence = index.sentences[id];
      return (
        categoriesParam.includes(sentence.category) &&
        sentence.length >= minLength &&
        sentence.length <= maxLength
      );
    });
    
    // 检查是否有可用句子
    if (candidateIds.length === 0) {
      return new Response(JSON.stringify({
        status: 404,
        message: '没有找到符合条件的句子',
        data: [],
        ts: Date.now()
      }), {
        status: 404,
        headers: { 
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // 随机选择一个句子ID
    const randomId = candidateIds[Math.floor(Math.random() * candidateIds.length)];
    const { category, position } = index.sentences[randomId];
    
    // 加载具体分类文件
    const categoryResponse = await env.ASSETS.fetch(
      new URL(`/sentences/${category}.json`, url)
    );
    const categoryData = await categoryResponse.json();
    const selectedSentence = categoryData[position];
    
    // 根据请求类型返回响应
    return formatResponse(selectedSentence, encodeType);
    
  } catch (error) {
    return new Response(JSON.stringify({
      status: 500,
      message: `服务器错误: ${error.message}`,
      data: [],
      ts: Date.now()
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

function formatResponse(sentence, encodeType) {
  const baseResponse = {
    status: 200,
    message: 'ok.',
    data: [sentence],
    ts: Date.now()
  };

  switch (encodeType.toLowerCase()) {
    case 'text':
      return new Response(sentence.hitokoto, {
        headers: { 
          'Content-Type': 'text/plain; charset=utf-8',
          'Access-Control-Allow-Origin': '*'
        }
      });
      
    default: // JSON响应
      return new Response(JSON.stringify(baseResponse), {
        headers: { 
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*'
        }
      });
  }
}