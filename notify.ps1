param(
    [string]$Title = "Gemini CLI",
    [string]$Message = "작업이 완료되었습니다."
)

# Load WinRT types
[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
[Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom, ContentType = WindowsRuntime] | Out-Null

# Manually escape special XML characters
$escapedTitle = $Title.Replace('&', '&amp;').Replace('<', '&lt;').Replace('>', '&gt;').Replace('"', '&quot;').Replace("'", '&apos;')
$escapedMessage = $Message.Replace('&', '&amp;').Replace('<', '&lt;').Replace('>', '&gt;').Replace('"', '&quot;').Replace("'", '&apos;')

# Create the XML payload from scratch
$xmlPayload = @"
<toast>
    <visual>
        <binding template="ToastText02">
            <text id="1">$escapedTitle</text>
            <text id="2">$escapedMessage</text>
        </binding>
    </visual>
</toast>
"@

# Load the XML
$xml = New-Object Windows.Data.Xml.Dom.XmlDocument
$xml.LoadXml($xmlPayload)

# Create and show the toast
$toast = [Windows.UI.Notifications.ToastNotification, Windows.UI.Notifications, ContentType = WindowsRuntime]::new($xml)
[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("Gemini CLI").Show($toast)