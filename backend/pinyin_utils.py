from pypinyin import pinyin, Style
import re


def to_pinyin_list(words, exclude_chars=['%']):
    pinyin_words = []
    for word in words:
        # 使用正则表达式分割中文字符和连续的英文字符
        parts = re.findall(r'([a-zA-Z]+|[\u4e00-\u9fff]+|[^a-zA-Z\u4e00-\u9fff]+)', word)

        # 对每个部分处理
        pinyin_parts = []
        for part in parts:
            if part in exclude_chars:
                continue
            if part.isalpha() and not '\u4e00' <= part <= '\u9fff':  # 纯英文字母
                pinyin_parts.append(part.lower())
            elif any('\u4e00' <= c <= '\u9fff' for c in part):  # 包含中文
                pinyin_part = pinyin(part, style=Style.NORMAL)
                pinyin_parts.append('_'.join([item[0] for item in pinyin_part]))
            else:  # 其他字符（如标点符号）
                pinyin_parts.append(part.lower())

        # 合并所有部分
        pinyin_word = '_'.join(pinyin_parts)
        pinyin_words.append(pinyin_word)

    assert len(pinyin_words) == len(words)
    
    # Handle duplicates by adding suffix numbers
    unique_pinyin_words = []
    seen = {}
    
    for word in pinyin_words:
        if word in seen:
            seen[word] += 1
            unique_word = f"{word}_{seen[word]}"
        else:
            seen[word] = 0
            unique_word = word
        unique_pinyin_words.append(unique_word)
    
    assert len(unique_pinyin_words) == len(words)
    assert len(unique_pinyin_words) == len(set(unique_pinyin_words))
    return unique_pinyin_words


if __name__ == '__main__':
    words = ['子图', '网元IP', '网元名称', '网元别名', '网元类型', 'ONT数量', 'MDU数量',
             'ETH上行口总数', '配置VLAN的上行端口数', 'ETH上行口在线数', 'ETH上行口使用率(%)',
             '聚合组数', 'PON单板数', 'PON端口数', 'PON端口使用数', 'PON端口空闲数',
             'PON端口使用率(%)', '总槽位数', '已占用槽位', '空闲槽位数', '槽位使用率(%)',
             '主控单板数', '级联单板数', '业务单板数', '上行单板数', '电源单板数']
    print(to_pinyin_list(words))