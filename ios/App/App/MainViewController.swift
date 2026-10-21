import UIKit
import Capacitor

/// Webansicht des Spiels: kein Schleier am Rand, Hintergrund in Leinenfarbe.
class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        let linen = UIColor(red: 0xEC / 255, green: 0xE7 / 255, blue: 0xDC / 255, alpha: 1)
        view.backgroundColor = linen
        webView?.backgroundColor = linen
        webView?.isOpaque = false
        guard let scrollView = webView?.scrollView else { return }
        scrollView.backgroundColor = linen
        scrollView.bounces = false
        #if compiler(>=6.2)
        if #available(iOS 26.0, *) {
            scrollView.topEdgeEffect.isHidden = true
            scrollView.bottomEdgeEffect.isHidden = true
        }
        #endif
    }
}
