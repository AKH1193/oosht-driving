package com.arkcreations.ooshtdriving

import android.Manifest
import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.media.AudioAttributes
import android.os.Build
import android.os.Bundle
import android.os.CancellationSignal
import android.os.Handler
import android.os.Looper
import android.os.VibrationAttributes
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.provider.Settings
import android.speech.tts.TextToSpeech
import java.util.Locale
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.webkit.WebViewAssetLoader
import org.json.JSONObject

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private val handler = Handler(Looper.getMainLooper())
    private var waitingForGpsSettings = false
    private var vibrator: Vibrator? = null
    private var tts: TextToSpeech? = null
    @Volatile private var ttsReady = false
    @Volatile private var ttsLangCode = "en"

    private val permissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { result ->
            val granted = result[Manifest.permission.ACCESS_FINE_LOCATION] == true ||
                result[Manifest.permission.ACCESS_COARSE_LOCATION] == true
            if (granted) startLocationFlow()
            else sendLocationError("Location permission is off. Allow it in the app's settings, or pick an area below.")
        }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        hideSystemBars()
        tts = TextToSpeech(this) { status ->
            if (status == TextToSpeech.SUCCESS) {
                val t = tts ?: return@TextToSpeech
                val kn = Locale("kn", "IN")
                val r = try { t.isLanguageAvailable(kn) } catch (_: Exception) { TextToSpeech.LANG_NOT_SUPPORTED }
                if (r >= TextToSpeech.LANG_AVAILABLE) { t.language = kn; ttsLangCode = "kn" }
                else { try { t.language = Locale("en", "IN") } catch (_: Exception) {}; ttsLangCode = "en" }
                ttsReady = true
            }
        }

        vibrator = if (Build.VERSION.SDK_INT >= 31) {
            (getSystemService(VibratorManager::class.java))?.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            getSystemService(Vibrator::class.java)
        }

        val assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        webView = WebView(this)
        webView.setBackgroundColor(Color.parseColor("#0D1116"))
        setContentView(webView)

        with(webView.settings) {
            javaScriptEnabled = true
            domStorageEnabled = true
            mediaPlaybackRequiresUserGesture = false
            allowFileAccess = false
            allowContentAccess = false
        }
        webView.addJavascriptInterface(Bridge(), "OoshtNative")
        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? =
                assetLoader.shouldInterceptRequest(request.url)

            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                if (request.url.host == "appassets.androidplatform.net") return false
                return try {
                    startActivity(Intent(Intent.ACTION_VIEW, request.url)); true
                } catch (e: Exception) {
                    true
                }
            }
        }
        webView.loadUrl("https://appassets.androidplatform.net/assets/www/index.html")

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                webView.evaluateJavascript("(window.__onBack && window.__onBack()) ? '1' : '0'") { r ->
                    if (r == null || !r.contains("1")) finish()
                }
            }
        })
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
        hideSystemBars()
        if (waitingForGpsSettings) {
            waitingForGpsSettings = false
            startLocationFlow()
        }
    }

    override fun onDestroy() {
        try { tts?.stop(); tts?.shutdown() } catch (_: Exception) {}
        tts = null
        super.onDestroy()
    }

    override fun onPause() {
        webView.onPause()
        super.onPause()
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) hideSystemBars()
    }

    private fun hideSystemBars() {
        WindowCompat.setDecorFitsSystemWindows(window, false)
        WindowInsetsControllerCompat(window, window.decorView).apply {
            hide(WindowInsetsCompat.Type.systemBars())
            systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        }
    }

    /* ---------------- location ---------------- */

    private fun hasLocationPermission(): Boolean =
        ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED ||
            ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED

    private fun locationEnabled(lm: LocationManager): Boolean =
        if (Build.VERSION.SDK_INT >= 28) lm.isLocationEnabled
        else lm.isProviderEnabled(LocationManager.GPS_PROVIDER) || lm.isProviderEnabled(LocationManager.NETWORK_PROVIDER)

    private fun startLocationFlow() {
        if (!hasLocationPermission()) {
            permissionLauncher.launch(
                arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION)
            )
            return
        }
        val lm = getSystemService(LOCATION_SERVICE) as LocationManager
        if (!locationEnabled(lm)) {
            AlertDialog.Builder(this)
                .setTitle("Turn on GPS")
                .setMessage("Wise City uses your phone's location to load the streets around you. Turn on Location, then come back to the game.")
                .setPositiveButton("Open settings") { _, _ ->
                    waitingForGpsSettings = true
                    try {
                        startActivity(Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS))
                    } catch (e: Exception) {
                        waitingForGpsSettings = false
                        sendLocationError("Couldn't open location settings. Turn on Location from quick settings, or pick an area below.")
                    }
                }
                .setNegativeButton("Not now") { _, _ ->
                    sendLocationError("GPS is off. Turn on Location, or pick an area below.")
                }
                .setOnCancelListener {
                    sendLocationError("GPS is off. Turn on Location, or pick an area below.")
                }
                .show()
            return
        }
        fetchLocation(lm)
    }

    @SuppressLint("MissingPermission")
    private fun fetchLocation(lm: LocationManager) {
        val last: Location? = lm.getProviders(true).mapNotNull {
            try { lm.getLastKnownLocation(it) } catch (e: Exception) { null }
        }.maxByOrNull { it.time }

        if (last != null && System.currentTimeMillis() - last.time < 120_000) {
            sendLocation(last); return
        }

        val provider = when {
            Build.VERSION.SDK_INT >= 31 && lm.isProviderEnabled(LocationManager.FUSED_PROVIDER) -> LocationManager.FUSED_PROVIDER
            lm.isProviderEnabled(LocationManager.GPS_PROVIDER) -> LocationManager.GPS_PROVIDER
            lm.isProviderEnabled(LocationManager.NETWORK_PROVIDER) -> LocationManager.NETWORK_PROVIDER
            else -> null
        }
        if (provider == null) {
            if (last != null) sendLocation(last)
            else sendLocationError("No location source is on. Turn on Location, or pick an area below.")
            return
        }

        var done = false
        val cancel = CancellationSignal()
        var listener: LocationListener? = null
        val finish: (Location?) -> Unit = { loc ->
            if (!done) {
                done = true
                listener?.let { try { lm.removeUpdates(it) } catch (_: Exception) {} }
                when {
                    loc != null -> sendLocation(loc)
                    last != null -> sendLocation(last)
                    else -> sendLocationError("Couldn't get a GPS fix. Try again near a window or outdoors, or pick an area below.")
                }
            }
        }
        handler.postDelayed({ if (!done) { cancel.cancel(); finish(null) } }, 20_000)

        try {
            if (Build.VERSION.SDK_INT >= 30) {
                lm.getCurrentLocation(provider, cancel, mainExecutor) { loc -> finish(loc) }
            } else {
                val l = LocationListener { loc -> finish(loc) }
                listener = l
                @Suppress("DEPRECATION")
                lm.requestSingleUpdate(provider, l, Looper.getMainLooper())
            }
        } catch (e: Exception) {
            finish(null)
        }
    }

    private fun sendLocation(loc: Location) {
        val o = JSONObject()
        o.put("ok", true)
        o.put("lat", loc.latitude)
        o.put("lon", loc.longitude)
        o.put("acc", loc.accuracy.toDouble())
        callJs("window.__nativeLocation && window.__nativeLocation($o)")
    }

    private fun sendLocationError(msg: String) {
        val o = JSONObject()
        o.put("ok", false)
        o.put("msg", msg)
        callJs("window.__nativeLocation && window.__nativeLocation($o)")
    }

    private fun callJs(js: String) {
        runOnUiThread { webView.evaluateJavascript(js, null) }
    }

    /* ---------------- vibration ---------------- */

    private fun vibrate(timings: LongArray, amps: IntArray) {
        val v = vibrator ?: return
        if (!v.hasVibrator()) return
        val t = ArrayList<Long>()
        val a = ArrayList<Int>()
        for (i in timings.indices) {
            if (timings[i] > 0) { t.add(timings[i]); a.add(amps[i].coerceIn(0, 255)) }
        }
        if (t.isEmpty()) return
        val effect = if (v.hasAmplitudeControl()) {
            VibrationEffect.createWaveform(t.toLongArray(), a.toIntArray(), -1)
        } else {
            /* phones without strength control: plain on/off pattern starting with a pause */
            val merged = ArrayList<Long>()
            var lastOn = false
            merged.add(0L)
            for (i in t.indices) {
                val on = a[i] > 0
                if (on == lastOn) merged[merged.size - 1] = merged[merged.size - 1] + t[i]
                else { merged.add(t[i]); lastOn = on }
            }
            VibrationEffect.createWaveform(merged.toLongArray(), -1)
        }
        try {
            if (Build.VERSION.SDK_INT >= 33) {
                v.vibrate(effect, VibrationAttributes.createForUsage(VibrationAttributes.USAGE_MEDIA))
            } else {
                @Suppress("DEPRECATION")
                v.vibrate(effect, AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_GAME).build())
            }
        } catch (e: Exception) {
            try { v.vibrate(effect) } catch (_: Exception) {}
        }
    }

    inner class Bridge {
        @JavascriptInterface
        fun requestLocation() {
            runOnUiThread { startLocationFlow() }
        }

        @JavascriptInterface
        fun vibrate(timingsCsv: String, ampsCsv: String) {
            val t = timingsCsv.split(',').mapNotNull { it.trim().toDoubleOrNull()?.toLong() }
            val a = ampsCsv.split(',').mapNotNull { it.trim().toDoubleOrNull()?.toInt() }
            if (t.isEmpty() || t.size != a.size) return
            this@MainActivity.vibrate(t.toLongArray(), a.toIntArray())
        }

        @JavascriptInterface
        fun ttsLang(): String = ttsLangCode

        @JavascriptInterface
        fun speak(text: String, pitch: Double, rate: Double) {
            val t = tts ?: return
            if (!ttsReady) return
            runOnUiThread {
                try {
                    t.setPitch(pitch.toFloat().coerceIn(0.5f, 2f))
                    t.setSpeechRate(rate.toFloat().coerceIn(0.5f, 1.6f))
                    t.speak(text, TextToSpeech.QUEUE_FLUSH, null, "wc" + System.nanoTime())
                } catch (_: Exception) {}
            }
        }
    }
}
