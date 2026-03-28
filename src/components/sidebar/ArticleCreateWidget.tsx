import { GuardedLink } from "@/components/shared/GuardedLink";
import { getTranslations } from "next-intl/server";

export const ArticleCreateWidget = async () => {
  const t = await getTranslations("sidebar");

  return (
    <section className="bg-card p-4 rounded-xl">
      <div className=" text-ellipsis line-clamp-1 overflow-hidden leading-6 font-semibold mb-3">
        <span>{t("quickPost")}</span>
      </div>
      <div className="grid grid-cols-3">
        <GuardedLink
          href="/create/image"
          className="py-2 w-full h-full flex flex-col items-center justify-center hover:bg-primary/15 cursor-pointer rounded-xl"
        >
          <div className="size-12 flex items-center justify-center  bg-[#3db8f533] rounded-full">
            <svg
              className="size-8"
              viewBox="0 0 1493 1024"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              p-id="34091"
              width="200"
              height="200"
            >
              <path
                d="M6.256735 237.414653C6.256735 106.250736 115.408321 0 250.041882 0h650.017886C1034.693329 0 1143.844915 106.250736 1143.844915 237.414653v435.241238C1143.844915 803.819808 1034.693329 910.070544 900.059768 910.070544H250.041882C115.408321 910.070544 6.256735 803.819808 6.256735 672.655891V237.414653z"
                fill="#DCF5F6"
                p-id="34092"
              ></path>
              <path
                d="M209.373104 514.360495a223.479198 217.620619 0 1 0 446.958396 0 223.479198 217.620619 0 1 0-446.958396 0Z"
                fill="#04BABE"
                p-id="34093"
              ></path>
              <path
                d="M867.297228 187.133256a41.237572 41.237572 0 0 0-70.359829 0l-245.491529 414.082097a41.237572 41.237572 0 0 1-70.359829 0l-52.101538-87.821807a41.066933 41.066933 0 0 0-70.359829 0l-244.012665 411.522524c-15.584958 26.278287 3.981559 59.325224 35.265234 59.325223H290.084986c22.410487 0 40.38438 21.386658 59.154585 33.274454 6.256735 3.981559 13.764817 6.313614 22.069211 6.313615H1292.868966c31.283675 0 50.850192-32.990057 35.208354-59.325224L867.297228 187.133256z"
                fill="#B4EBED"
                p-id="34094"
              ></path>
            </svg>
          </div>
          <span className="text-sm mt-2">{t("image")}</span>
        </GuardedLink>
        <GuardedLink
          href="/create/post"
          className="py-2 w-full h-full flex flex-col items-center justify-center hover:bg-primary/15 cursor-pointer rounded-xl"
        >
          <div className="size-12 flex items-center justify-center bg-orange-100 rounded-full ">
            <svg
              className="size-8"
              viewBox="0 0 1024 1024"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              p-id="2407"
              width="200"
              height="200"
            >
              <path
                d="M897.024 328.362667l-538.453333 538.453333a209.322667 209.322667 0 0 1-127.573334 60.16l-122.453333 11.52a20.906667 20.906667 0 0 1-23.04-23.04l11.52-122.453333a209.322667 209.322667 0 0 1 60.16-127.573334l538.453333-538.453333a142.421333 142.421333 0 0 1 201.386667 201.386667z"
                fill="#FFB531"
                p-id="2408"
              ></path>
              <path
                d="M812.544 256.682667l-74.24 73.813333a30.293333 30.293333 0 0 1-22.613333 9.386667 31.658667 31.658667 0 0 1-22.613334-9.386667 32.170667 32.170667 0 0 1 0-45.226667l74.24-73.813333a32 32 0 0 1 45.226667 45.226667z"
                fill="#030835"
                p-id="2409"
              ></path>
            </svg>
          </div>
          <span className="text-sm mt-2">{t("article")}</span>
        </GuardedLink>
        <GuardedLink
          href="/create/video"
          className="py-2 w-full h-full flex flex-col items-center justify-center hover:bg-primary/15 cursor-pointer rounded-xl"
        >
          <div className="size-12 flex items-center justify-center bg-red-100 rounded-full ">
            <svg
              className="size-8"
              viewBox="0 0 1024 1024"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              p-id="4542"
              width="200"
              height="200"
            >
              <path
                d="M102.4 153.6m76.8 0l665.6 0q76.8 0 76.8 76.8l0 563.2q0 76.8-76.8 76.8l-665.6 0q-76.8 0-76.8-76.8l0-563.2q0-76.8 76.8-76.8Z"
                fill="#FF7C83"
                p-id="4543"
              ></path>
              <path
                d="M445.1072 385.0624C425.4976 373.8496 409.6 383.168 409.6 405.696v212.5824c0 22.6176 15.8976 31.8464 35.5072 20.6336l186.2784-106.624c19.6096-11.2128 19.6096-29.4016 0-40.6272l-186.2784-106.5984z"
                fill="#E05050"
                p-id="4544"
              ></path>
            </svg>
          </div>
          <span className="text-sm mt-2">{t("video")}</span>
        </GuardedLink>
      </div>
    </section>
  );
};
