import { Dropbox } from "dropbox";
import fetch from "node-fetch"; // Needed for Node.js

const DROPBOX_ACCESS_TOKEN = "sl.u.AFgYzajD91PmPajw39ID6EFnCnpEkfbFkNgRX4yCgqQlNnM_KY6C50aK0eZtE9Z5hRenB6adnTQMWQx3b7fwPlN1g1gV7GKuHVmM2TjrvgCDzWLGl_HrPHBuMExQe9cvf26yL8iBajkgSL_rNg5hKZmulrxgAfUHIUwD4IRmxHuEwBRK9LCbqdYEkL_r7_7OsH86mWAmkQHCk7TZI8Ow1phiwVAUq2ok8Z8t13TAxsY3WJ2-wQvnqoXm2Y0PprlGtHa5dV7_eO5xQk-lJ1kPKQKL32AOZxAW5HyXonnzSlK7Tkp1p4h92uD0Pcs5KHcwNNdKb7q2LPBmj5RkOzb8j47dzGLaDwJc5XTfBigJcV8AvcopXHBRYpGkjgxxY_3z2LuMpqLkbwNu_7SbN_qT8V03I-jQYVjZtvwyCshe-n5G47JnjyodM2WZnAGuwg-1RaZQb8Nkqcr8zKZ4xe6Al6JKpkkev9lhZE07gKSK1Avd3mm0moUz9DKruCJYyqRQ8cExkMWKPCKNe4Vl_SwhIxH1bYjtXSFQ8JMt2q-S9cpS9A5XDlf9-sZddZuiwU7J8Mey2nODuBOtcwjjK1V68SVH5mYRPnI-mJSrRXSlpjupQUF8SkHvZZ48E9-Dam6ZZX-0nzrB_0K-niTmLtdXk3a2XiTYTeBw552SLifpPzqt23ceuDHu6mkxNdItS6Uhn9aBQEG9JTqgZ3unaK5bOPNNfLO6tJQw9DREVhLPFEFJ0e-T85thTDwGHSCcTAyBuxfLPpo9zqVH0Ddr-UNt6ZhAf_aR-WDNqC55UK2Gtnm4duFC5A7EWU1Fn0F5uuvm_s3zJfv5YjIXsiwRZhORjZReAZH58IIE81hes2HeGanqP1HlhoQ0ytcoONRI1i72s-RybU8gW0k3Y8SmdTureKZPIhZcKR7XPB9xinLjdfu0Zwye-NfeyQuS-EamYT--KtWpXTfFModdrhrPhIDcIG5scOSeHdNsVJM1HMnkqyAPYkQMXtxIbaFfAT54Quj0NSvXt5fDWy4NDbv-WOA_IHRRJ-LlirJ1XVchejXHdJ2TvToga8yHjVaWLu7PY2tnyMdGKorsfpnbJnLtjEgZOYpqYji8KymirNHyJ0LLodpDbH9cYhQLDCun0NR0usyIZnyEyWC98zgni5y6thEZoQhfp7Tj6ZeaXDJ3R0pWuIO1xK5vxSJOGS6uBaT5NcwnuojbgXn_oBbjXgsOvsFYCtKE1siX2FDWGXnty9IlrNqoJ8ktz0yGA5FtgLfcPfcrQc886KRIyr-wYoTOdJiXFjWO";


const dropbox = new Dropbox({
    accessToken: DROPBOX_ACCESS_TOKEN,
    fetch
});

const listFiles = async () => {
    try {
        const response = await dropbox.filesListFolder({ path: "" });
        console.log("📂 Files in Dropbox:", response.result.entries);
    } catch (error) {
        console.error("❌ Error listing files:", error.message || error);
    }
};

listFiles();

