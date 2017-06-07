const os = require('os');
const eol = os.EOL;
const fs = require('fs');

const docjson = process.argv[2];

let docname = process.argv[3];

// Menu
const renderMenu = (items) => {
    let menuDOM = '';

    items.forEach((item, index) => {
        // 文件夹内的API，如果undefined则表示是最外层的API
        const subItems = item.item;

        // 通用，顶级菜单生成，包括API和文件夹
        menuDOM = menuDOM + `* [${item.name}](#${index})${eol}`;

        // 文件夹内的子API生成二级菜单
        if (subItems !== undefined) {
            subItems.forEach((subItem, subItemIndex) => {
                menuDOM = menuDOM + `  * [${subItem.name}](#${index}-${subItemIndex})${eol}`;
            })
        }
    });

    return menuDOM;
};

// RequestHeader
const renderRequestHeader = (headerList) => {
    const headerThead = '**Request Header**' + eol +
                        '| 字段名 | 取值 | 备注 |' + eol +
                        '|---|---|---|' + eol;
    let headerDoc = '';

    if (headerList.length > 0) {
        headerDoc = headerThead + headerList.map((item) => {
            return `| ${item.key} | ${item.value} | ${item.description} | ${eol}`;
        }).join('');
    }

    return headerDoc;
};

// RequestBodyb 
// TODO RAW类型
const renderRequestBody = (requestBodyData) => {
    const bodyThead = '**Request Body**' + eol +
                        '| 字段名 | 取值 | 类型 | 备注 |' + eol + 
                        '|---|---|---|---|' + eol;
    let bodyDoc = '';

    if (requestBodyData.mode !== undefined) {
        bodyDoc = bodyThead + requestBodyData[requestBodyData.mode].map((item) => {
            let des = '';

            if (item.description !== undefined) {
                des = item.description;
            }
            
            return `| ${item.key} | ${item.value} | ${item.type} | ${des} | ${eol}`;
        }).join('');
    }

    return bodyDoc;
};

// 单接口文档
const renderDocOfItem = (item, id) => {
    let md = '';
    let requestMethod = '';
    let requestTitle = '';
    let requestDescription = '';
    let requestUrl = '';
    let requestHeader = '';
    let requestBody = '';

    requestMethod = `<span class="method">${item.request.method}</span>`;
    requestTitle = `<h3 id="${id}">${requestMethod} ${item.name}</h3>`;
    requestHeader = renderRequestHeader(item.request.header);
    requestBody = renderRequestBody(item.request.body);

    requestDescription = item.request.description;

    requestUrl = '```' + eol +
                item.request.url + eol +
                '```';

    md = requestTitle + eol +
         requestUrl + eol +
         requestDescription + eol +
         requestHeader + eol +
         requestBody + eol +
         eol;

    return md;
};

// 全部文档
const renderDoc = (apidoc) => {
    const {
        info,
        item: items,
    } = apidoc;
    
    let docDOM = `# ${info.name}` + eol +
                 renderMenu(items) + eol;

    items.forEach((item, index) => {
        // 文件夹内的API，如果undefined则表示是最外层的API
        const subItems = item.item;
        let folderTitle = '';
        let folderDescription = '';

        if (subItems === undefined) {
            // 顶级API（暂不考虑空文件夹的场景！）
            docDOM = docDOM + renderDocOfItem(item, index);
        } else {
            // 文件夹及下属API
            folderTitle = `<h2 id="${index}">${item.name}</h2>`;

            if (item.description !== '') {
                folderDescription = eol + item.description + eol;
            } else {
                folderDescription = eol;
            }

            docDOM = docDOM +
                     folderTitle +
                     folderDescription +
                     subItems.map((subItem, subItemIndex) => {
                         return renderDocOfItem(subItem, `${index}-${subItemIndex}`);
                     }).join('');
        }
    });

    return docDOM; 
};


// 生成文件
const renderMDFile = (apidoc) => {
    const doc = renderDoc(apidoc);

    if (docname === undefined) {
        docname = `${apidoc.info.name}.md`;
    }

    fs.open(docname, 'w', 0644, function(err, fd){
        if (err) {
            return console.log(err);
        }

        fs.write(fd, doc, function(e){
            if (e) {
                return console.log(e);
            }
            fs.closeSync(fd);
        });
    });
};

fs.readFile(docjson, function(err, data){
    if (err) {
        return console.error(err);
    }

    renderMDFile(JSON.parse(data));
});