import { Image, PenLine, Video } from "lucide-react"

export const ArticleCreateWidget = () => {
    return (
        <section className="bg-card p-4 rounded-xl">
            <div className=" text-ellipsis line-clamp-1 overflow-hidden leading-6 font-semibold mb-3">
                <span>快来发帖吧</span>
            </div>
            <div className="grid grid-cols-3">
                <div className="py-2 w-full h-full flex flex-col items-center justify-center hover:bg-primary/15 cursor-pointer rounded-xl">
                    <div className="size-12 flex items-center justify-center  bg-[#3db8f533] rounded-full">
                        <svg className="size-8" viewBox="0 0 1493 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="34091" width="200" height="200"><path d="M6.256735 237.414653C6.256735 106.250736 115.408321 0 250.041882 0h650.017886C1034.693329 0 1143.844915 106.250736 1143.844915 237.414653v435.241238C1143.844915 803.819808 1034.693329 910.070544 900.059768 910.070544H250.041882C115.408321 910.070544 6.256735 803.819808 6.256735 672.655891V237.414653z" fill="#DCF5F6" p-id="34092"></path><path d="M209.373104 514.360495a223.479198 217.620619 0 1 0 446.958396 0 223.479198 217.620619 0 1 0-446.958396 0Z" fill="#04BABE" p-id="34093"></path><path d="M867.297228 187.133256a41.237572 41.237572 0 0 0-70.359829 0l-245.491529 414.082097a41.237572 41.237572 0 0 1-70.359829 0l-52.101538-87.821807a41.066933 41.066933 0 0 0-70.359829 0l-244.012665 411.522524c-15.584958 26.278287 3.981559 59.325224 35.265234 59.325223H290.084986c22.410487 0 40.38438 21.386658 59.154585 33.274454 6.256735 3.981559 13.764817 6.313614 22.069211 6.313615H1292.868966c31.283675 0 50.850192-32.990057 35.208354-59.325224L867.297228 187.133256z" fill="#B4EBED" p-id="34094"></path></svg>
                    </div>
                    <span className="text-sm mt-2">图片</span>
                </div>
                <div className="py-2 w-full h-full flex flex-col items-center justify-center hover:bg-primary/15 cursor-pointer rounded-xl">
                    <div className="size-12 flex items-center justify-center bg-green-100 rounded-full text-green-600">
                        <PenLine size={20} />
                    </div>
                    <span className="text-sm mt-2">文章</span>
                </div>
                <div className="py-2 w-full h-full flex flex-col items-center justify-center hover:bg-primary/15 cursor-pointer rounded-xl">
                    <div className="size-12 flex items-center justify-center text-orange-600 bg-orange-100 rounded-full ">
                        <Video size={20} />
                    </div>
                    <span className="text-sm mt-2">视频</span>
                </div>
            </div>
        </section>
    )
}