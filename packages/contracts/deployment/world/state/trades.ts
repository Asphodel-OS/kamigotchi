import { AdminAPI } from '../api';

// TODO: ids are hardcoded for now bc script is finicky with hex inputs
export const cancelTrades = async (api: AdminAPI) => {
  const ids = [
    '0x48199f38595ac226a777cae31ceb191c2e8e751e14f28f0afb44fb25eac27016',
    '0x366af9ae048ca2e5f56ad7649a8e6550cede852905e2fd2b7c67cdb5f4bb50f',
    '0x84896a1a30721882820f9e1466d935ee1a8fc6f4749ab76296407149157d1459',
    '0x38e81dfc4b75b23dac8fa1268a62d6dea701e5ea629a852d39c646e06c36f8a',
    '0xc7107ae6f448c04066c29b998fd9408cc0d87ec555a0dd70d034dfff47d640bb',
  ];
  await api.trade.cancel(ids);
};

// TODO: ids are hardcoded for now bc script is finicky with hex inputs
export const completeTrades = async (api: AdminAPI) => {
  const ids = [
    '0xf8ef82b9e8864f88b70b7862aa2626c61d1436ca867056bee5c8bc94d65f64cb',
    '0x849476b0be6462bf844e8df8f6dc53e7e035b9c7b0cacde92493382bef7e3f4e',
    '0x34a3a2ad3fedf2e30916aa316a7ce2e0df7d022c2e5f25e9bde92295091a882c',
    '0x94215ee12c6dbb57d227d1637104d83ba238991dfd251fdb54727ef2b38c4896',
  ];
  await api.trade.complete(ids);
};
