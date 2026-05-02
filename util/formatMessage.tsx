import { ServerMessage } from "@/types";


// const toDayKey = (isoOrDate: string | Date) => {
//   if (!isoOrDate) return "invalid"; // guard against undefined/null

//   const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
//   if (!(d instanceof Date) || Number.isNaN(d.getTime())) return "invalid";

//   return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
//     d.getDate()
//   ).padStart(2, "0")}`;
// };



//   const dayLabel = (isoOrDate: string | Date) => {
//     const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
//     if (Number.isNaN(d.getTime())) return "";

//     const now = new Date();
//     const todayKey = toDayKey(now);
//     const yesterday = new Date(now);
//     yesterday.setDate(now.getDate() - 1);
//     const yesterdayKey = toDayKey(yesterday);
//     const key = toDayKey(d);

//     if (key === todayKey) return "Today";
//     if (key === yesterdayKey) return "Yesterday";

//     return new Intl.DateTimeFormat(undefined, {
//       weekday: "short",
//       day: "2-digit",
//       month: "short",
//       year: "numeric",
//     }).format(d);
//   };

const toDayKey = (isoOrDate: string | Date) => {
  if (!isoOrDate) return "invalid"; // guard against undefined/null

  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return "invalid";

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

const dayLabel = (isoOrDate: string | Date) => {
  if (!isoOrDate) return ""; // guard against undefined/null

  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return "";

  const now = new Date();
  const todayKey = toDayKey(now);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayKey = toDayKey(yesterday);
  const key = toDayKey(d);

  if (key === todayKey) return "Today";
  if (key === yesterdayKey) return "Yesterday";

  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
};



export const transformMessages = (messages: ServerMessage[]) => {
    const result: any[] = [];
    let lastLabel: string | null = null;
  
    messages.forEach((msg) => {
      const label = dayLabel(msg.createdAt);
  
      if (label !== lastLabel) {
        result.push({
          type: "label",
          text: label,
          id: `label-${msg._id}`,
        });
        lastLabel = label;
      }
  
      result.push({
        type: "message",
        data: msg,
        id: msg._id,
      });
    });
    return result;
  };

export const transformSingleMessage = (message: ServerMessage, lastLabelDate: Date | string) => {
  const result: any[] = [];
  console.log("messafge", message);
  console.log("createdAt", message.createdAt);
  console.log("lastLabelDate", lastLabelDate);

    const label = dayLabel(message.createdAt);
    const lastLabel = dayLabel(lastLabelDate);

    if (label !== lastLabel) {
      result.push({
        type: "label",
        text: label,
        id: `label-${message._id}`,
      });
    }

    result.push({
      type: "message",
      data: message,
      id: message._id,
    });
  return result;
}