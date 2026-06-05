/**
 * 提取后端响应中的真正数据内容
 *
 * 使用场景：
 * - 后端标准结构为 { code, msg, data }，提取 data
 * - 如果结构为 { code, msg, ... }，则返回整个 res.data
 *
 * @param res - Axios 响应对象
 * @returns 提取后的数据对象，若无数据则返回 null
 */
export function safeData(res: any) {
    if (!res || !res.data) return null

    // 优先获取 res.data.data，若无则取 res.data
    return res.data.data ?? res.data
}
